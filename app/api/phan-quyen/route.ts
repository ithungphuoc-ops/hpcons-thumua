import { NextRequest, NextResponse } from "next/server";
import {
  verifyClientIdToken,
  fetchVaiTroToanCuc,
  fetchDanhBaCongTy,
  docHoSoNguoiDungMayChu,
  ghiHoSoNguoiDungMayChu,
} from "@/5-ket-noi/hpcore-may-chu";
import { hopLe, thanhNguoiDung, type HoSoTaiKhoan } from "@/5-ket-noi/ho-so-tai-khoan";
import { capDatDuocToiDa, duocDatCap, duocSuaHoSo } from "@/4-phan-quyen/luat-phan-quyen";
import { timVaiTroChuan, vaiTroGanDuocBoi } from "@/4-phan-quyen/vai-tro-chuan";
import { VAI_TRO_CHUAN } from "@/4-phan-quyen/vai-tro-chuan";
import type { NguoiDung } from "@/4-phan-quyen/quyen";

function layIdToken(req: NextRequest): string | undefined {
  const header = req.headers.get("authorization") ?? "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m?.[1];
}

/**
 * ★ ĐƯỜNG GHI DUY NHẤT của hồ sơ `nguoi-dung/{uid}` — Ban lãnh đạo 20/08/2026: *"thiết lập
 * phân quyền trực tiếp trên app luôn... không cần làm ngoài app tổng"*.
 *
 * 🔴 TRƯỚC ĐÂY: Firestore khóa cứng `allow write: if false` (xem `firestore-chay-thu.rules`) vì
 * chưa có chỗ nào KIỂM LUẬT trước khi ghi — mở ghi trực tiếp từ trình duyệt là ai cũng tự nâng
 * quyền mình. NAY: route này (chạy máy chủ, dùng Admin SDK đi vòng qua rules) tự kiểm ĐÚNG luật
 * đã có sẵn ở `4-phan-quyen/luat-phan-quyen.ts` TRƯỚC KHI ghi — một chỗ duy nhất, y hệt luật
 * màn hình dùng để ẩn/hiện nút, nên không thể có chuyện "nút bị khóa trên giao diện nhưng
 * đường ghi vẫn nhận".
 *
 * Nhận `maVaiTro` (mã trong `VAI_TRO_CHUAN`), KHÔNG nhận thẳng `chucNang/vaiTro/capTM` — để
 * route TỰ tra cứu từ danh mục chuẩn, trình duyệt không tự bịa ra một tổ hợp quyền không có
 * trong danh mục.
 */
export async function POST(req: NextRequest) {
  const caller = await verifyClientIdToken(layIdToken(req));
  if (!caller) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const targetUid = typeof body?.targetUid === "string" ? body.targetUid : "";
  const maVaiTro = typeof body?.maVaiTro === "string" ? body.maVaiTro : "";
  if (!targetUid || !maVaiTro) {
    return NextResponse.json({ error: "Thiếu targetUid hoặc maVaiTro." }, { status: 400 });
  }
  const vt = timVaiTroChuan(maVaiTro);
  if (!vt) {
    return NextResponse.json({ error: `Vai trò "${maVaiTro}" không có trong danh mục.` }, { status: 400 });
  }

  // ---------- Xác định quyền của NGƯỜI ĐANG GỌI (không tin trình duyệt tự khai) ----------
  const vaiTroToanCucCaller = await fetchVaiTroToanCuc(caller.uid);
  let nguoiGoi: NguoiDung;
  if (vaiTroToanCucCaller === "owner") {
    // Đúng ngoại lệ đã áp dụng ở docHoSoTaiKhoan() phía trình duyệt — owner toàn quyền, kể cả
    // phân quyền cho người khác, không cần hồ sơ nguoi-dung/{uid} riêng.
    const quanTri = VAI_TRO_CHUAN.find((v) => v.ma === "quan_tri")!;
    nguoiGoi = {
      uid: caller.uid,
      tenHienThi: "Chủ sở hữu hệ thống",
      chucDanh: "—",
      phongBan: "—",
      chucNang: quanTri.chucNang,
      vaiTro: quanTri.vaiTro,
      capTM: quanTri.capTM,
      capKho: quanTri.capKho,
    };
  } else {
    const hoSoGoiRaw = await docHoSoNguoiDungMayChu(caller.uid);
    const hoSoGoi = (hoSoGoiRaw ?? undefined) as Partial<HoSoTaiKhoan> | undefined;
    if (!hopLe(hoSoGoi)) {
      return NextResponse.json({ error: "Bạn chưa được cấp quyền phân quyền ở app Thu mua." }, { status: 403 });
    }
    nguoiGoi = thanhNguoiDung(hoSoGoi);
  }

  const toiDa = capDatDuocToiDa(nguoiGoi);
  if (toiDa === 0) {
    return NextResponse.json({ error: "Bạn không có quyền phân quyền cho người khác." }, { status: 403 });
  }

  // ---------- Nếu SỬA hồ sơ đã có sẵn: kiểm được sửa không (cấp hiện tại của người bị sửa) ----------
  const hoSoCu = await docHoSoNguoiDungMayChu(targetUid);
  if (hoSoCu && hopLe(hoSoCu)) {
    const laChinhMinh = caller.uid === targetUid;
    const xetSua = duocSuaHoSo(nguoiGoi, hoSoCu.capTM, laChinhMinh);
    if (!xetSua.duoc) {
      return NextResponse.json({ error: xetSua.lyDo }, { status: 403 });
    }
  }

  // ---------- Cấp MỚI có nằm trong tầm người gọi đặt được không ----------
  const xetCap = duocDatCap(nguoiGoi, vt.capTM);
  if (!xetCap.duoc) {
    return NextResponse.json({ error: xetCap.lyDo }, { status: 403 });
  }
  // Vai trò "chỉ Quản trị gán được" (vd Ban Giám đốc — cấp số thấp nhưng quyền xem rất rộng) —
  // capTM một mình không diễn tả nổi, phải kiểm riêng đúng như màn hình đã làm.
  if (!vaiTroGanDuocBoi(toiDa).some((x) => x.ma === vt.ma)) {
    return NextResponse.json({ error: `Vai trò "${vt.ten}" chỉ tài khoản Quản trị mới gán được.` }, { status: 403 });
  }

  // ---------- Lấy hồ sơ THẬT từ danh bạ công ty để điền tên/email/phòng ban ----------
  const danhBa = await fetchDanhBaCongTy();
  const thanhVien = danhBa.find((t) => t.uid === targetUid);
  if (!thanhVien) {
    return NextResponse.json({ error: "Không tìm thấy người này trong danh bạ công ty (có thể đã nghỉ việc)." }, { status: 404 });
  }

  await ghiHoSoNguoiDungMayChu(targetUid, {
    // uidNghiepVu: GIỮ NGUYÊN nếu đã có (tài khoản mẫu cũ mang mã "u-tmX" gắn khắp dữ liệu cũ),
    // người MỚI thì dùng thẳng mã Firebase làm mã nghiệp vụ luôn — người thật mới thêm không có
    // mã "u-tmX" định sẵn nào cả.
    uidNghiepVu: (hoSoCu?.uidNghiepVu as string | undefined) || targetUid,
    email: thanhVien.email,
    tenHienThi: thanhVien.hoTen,
    chucDanh: thanhVien.chucDanh || (hoSoCu?.chucDanh as string | undefined) || "",
    phongBan: thanhVien.phongBan || (hoSoCu?.phongBan as string | undefined) || "",
    chucNang: vt.chucNang,
    vaiTro: vt.vaiTro,
    capTM: vt.capTM,
    // Vai trò không có capKho thì ghi 0 chứ không bỏ qua — bỏ qua là giữ nguyên quyền kho cũ.
    capKho: vt.capKho ?? 0,
    dangLamViec: true,
  });

  return NextResponse.json({ ok: true });
}
