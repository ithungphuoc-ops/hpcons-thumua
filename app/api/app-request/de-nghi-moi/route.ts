import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getHpcoreDb } from "@/5-ket-noi/hpcore-may-chu";
import { DUONG_DAN, bo0Undefined } from "@/3-du-lieu/kho-chung-firestore";
import { maDeNghiTiepTheo } from "@/2-quy-trinh/dat-ten-de-nghi";
import {
  quyDoiPhongBan,
  tachCongTrinhTuChuoi,
  xacDinhMaDuAnTamThoi,
} from "@/2-quy-trinh/tich-hop-app-request";
import type { DeNghiMuaHang, DongDeNghi, DonDatHang } from "@/3-du-lieu/kieu-du-lieu";
import type { DuLieuLuu } from "@/3-du-lieu/luu-tren-may";
import type { DeNghiMoiTuAppRequest, KetQuaNhanDeNghiTuAppRequest } from "@/3-du-lieu/tich-hop-app-request-types";
import { boDau } from "@/6-tien-ich/bo-dau";
import { TEN_COLLECTION_NHAT_KY } from "@/3-du-lieu/nhat-ky-he-thong";
import { soNgayDaTroiQua } from "@/2-quy-trinh/tinh-toan";

// "Cửa tiếp nhận" của App Thu mua cho App Request — xem hợp đồng dữ liệu đầy đủ tại
// 3-du-lieu/tich-hop-app-request-types.ts.
//
// Gọi cho MỌI đề xuất duyệt xong bên App Request (có công trình hay không) — khác nhánh họ
// đang gọi sang QLK CTR (chỉ có ý nghĩa khi có công trình). Việc 1, Sếp chốt 19/08/2026.
//
//   POST /api/app-request/de-nghi-moi
//
// Bảo vệ tạm bằng header x-api-key nếu đã cấu hình APP_REQUEST_API_KEY — chưa cấu hình thì
// API vẫn chạy được ngay (để test trước khi 2 đội thống nhất khóa), đúng kiểu QLK CTR đang
// làm với chính App Request.
//
// 📌 Dùng CHUNG kết nối Admin SDK với cầu nối SSO (`getHpcoreDb()` ở
// `5-ket-noi/hpcore-may-chu.ts`) — cùng project `hpcons-portal`, không cần khóa/project riêng
// nào khác cho route này (20/08/2026, sau khi xác nhận lại với IT).
export async function POST(req: NextRequest): Promise<NextResponse<KetQuaNhanDeNghiTuAppRequest>> {
  const apiKeyYeuCau = process.env.APP_REQUEST_API_KEY;
  if (apiKeyYeuCau) {
    const apiKeyGui = req.headers.get("x-api-key");
    if (apiKeyGui !== apiKeyYeuCau) {
      return NextResponse.json({ ok: false, error: "Thiếu hoặc sai x-api-key." }, { status: 401 });
    }
  }

  let payload: DeNghiMoiTuAppRequest;
  try {
    payload = (await req.json()) as DeNghiMoiTuAppRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Body gửi lên không phải JSON hợp lệ." }, { status: 400 });
  }

  if (!payload.requestCode?.trim() || !payload.nguoiGuiEmail?.trim() || !payload.vatTu?.length) {
    return NextResponse.json(
      { ok: false, error: "Thiếu dữ liệu bắt buộc (requestCode / nguoiGuiEmail / vatTu)." },
      { status: 400 },
    );
  }

  try {
    const db = getHpcoreDb();
    const docRef = db.collection(DUONG_DAN.boSuuTap).doc(DUONG_DAN.tep);

    // Transaction: đọc + kiểm trùng + ghi trong một bước — chặn trường hợp App Request gọi
    // lại 2 lần gần nhau (retry do mạng lỗi) tạo ra 2 đề nghị trùng mã đề xuất.
    const ketQua = await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      const data = (snap.exists ? snap.data() : {}) as Partial<DuLieuLuu>;
      const deNghiHienCo: DeNghiMuaHang[] = Array.isArray(data.deNghi) ? data.deNghi : [];

      const trungRoi = deNghiHienCo.find((d) => d.maDeXuatAppRequest === payload.requestCode);
      if (trungRoi) {
        return { moi: false as const, deNghi: trungRoi };
      }

      const congTrinh = tachCongTrinhTuChuoi(payload.congTrinhChuoi);
      const maPhongBan = quyDoiPhongBan(payload.phongBan);
      const maDuAnTam = xacDinhMaDuAnTamThoi(congTrinh, maPhongBan);
      const maDaDung = deNghiHienCo.map((d) => d.code);
      const maMoi = maDeNghiTiepTheo(maDuAnTam, maDaDung);

      const ngayCanHang = payload.ngayCanGiao || congThemNgay(payload.ngayDuyet, 7);

      const items: DongDeNghi[] = payload.vatTu.map((vt, i) => ({
        stt: i + 1,
        tenVatLieu: vt.tenVatTu,
        quyCach: vt.quyCach,
        donViTinh: vt.dvt,
        khoiLuongDeNghi: vt.soLuong,
        mucDichSuDung: vt.mucDichSuDung,
      }));

      const deNghiMoi: DeNghiMuaHang = {
        id: randomUUID(),
        code: maMoi,
        maDuAn: maDuAnTam,
        maHopDongCDT: congTrinh?.maHopDongCDT,
        tenCongTrinh: congTrinh?.tenCongTrinh ?? "",
        tieuDe: payload.tieuDe?.trim() || `Đề nghị từ App Request #${payload.requestCode}`,
        phongBanNguon: maPhongBan,
        nguoiDeNghiUid: payload.nguoiGuiUid || payload.nguoiGuiEmail,
        nguoiDeNghiTen: payload.nguoiGuiTen,
        ngayDeNghi: payload.ngayGui || payload.ngayDuyet,
        ngayDuyet: payload.ngayDuyet,
        ngayCanHang,
        mucDoUuTien: "binh_thuong",
        trangThai: "da_duyet",
        items,
        lichSu: [
          {
            thoiDiem: new Date().toISOString(),
            nguoiThucHien: "Hệ thống (App Request)",
            hanhDong: "Tạo tự động từ đề xuất đã duyệt",
            ghiChu: `Mã đề xuất App Request: ${payload.requestCode}`,
          },
        ],
        maDeXuatAppRequest: payload.requestCode,
      };

      /**
       * ★★★ TỰ ĐỘNG ĐIỀN PO "CHỜ ĐỀ NGHỊ" — thêm 29/08/2026 (Sếp chốt qua demo "Ngã Rẽ Lập
       * PO"), việc 3 của Cách 3: PO lập trước qua module độc lập, đề nghị về sau qua đường
       * bình thường này, tự khớp lại — không cần app Đề Xuất biết gì về PO bên Thu Mua.
       *
       * 🔴 CHỈ ĐIỀN, KHÔNG TỰ CHỐT — sửa lại 29/08/2026 (chiều), sau review PR (CodeRabbit +
       * nội bộ): bản đầu tự set `trangThai: "da_chot"` ngay khi khớp — Sếp xác nhận CẦN thêm
       * một lớp NGƯỜI THẬT xác nhận trước khi chốt, vì `maDuAn` dù đúng khuôn Thông báo 09/2026
       * vẫn có xác suất trùng ngẫu nhiên giữa hai dự án khác nhau (lỗi đặt mã, dự án đổi tên…).
       * PO vẫn GIỮ `"cho_de_nghi"` sau khi điền `prId`/`prCode` — chỉ khác trước ở chỗ giờ đã có
       * `prId` (phân biệt với PO "cho_de_nghi" CHƯA khớp gì bằng chính field này, xem
       * `HopGanDeNghi`/`HopXacNhanTuDongGan`). Trưởng bộ phận xác nhận thật ở
       * `xacNhanTuDongGanDeNghi` (`kho-du-lieu.tsx`) mới chuyển "da_chot".
       *
       * 🔴 KHÓA CHÍNH LÀ `maDuAn`, KHÔNG PHẢI "Theo hợp đồng" — đọc kỹ trước khi đổi:
       * `maHopDongCDT` của đề nghị chỉ là phần TRƯỚC dấu " - " trong ô "Tên đề xuất"
       * (`tachCongTrinhTuChuoi`), một MÃ NGẮN theo khuôn Thông báo 09/2026 — CÙNG KHUÔN với
       * `maDuAn` bên PO (chọn từ dự án có sẵn hoặc gõ tay theo đúng khuôn đó). Còn "Theo hợp
       * đồng" bên PO (từ 27/08/2026) là GHI CHÚ TỰ DO cả câu ("HĐ số 089/2026/HĐKT-HPC ký
       * ngày 01/08") — không cùng định dạng với mã ngắn bên đề nghị, so trực tiếp hai chuỗi
       * này dễ trật. Vì vậy `maDuAn` là điều kiện BẮT BUỘC; "Theo hợp đồng" chỉ là TÍN HIỆU
       * PHỤ — có ở cả hai bên mà KHÁC nhau (sau khi chuẩn hoá) thì coi là cờ báo động, dừng
       * lại không tự gắn; thiếu ở một bên (rất hay gặp, vì cả hai đều là ô tuỳ chọn) thì
       * không tính là mâu thuẫn, vẫn cho gắn theo `maDuAn`.
       *
       * 🔴 CHỈ ĐIỀN KHI TÌM RA ĐÚNG 1 ỨNG VIÊN. Ra 0 hoặc ≥2 kết quả đều để nguyên "chờ đề
       * nghị" KHÔNG `prId` — nhiều PO cùng mã dự án là chuyện thật (nhiều lần mua cho cùng công
       * trình), tự chọn bừa 1 cái là gắn nhầm PO của người khác vào đề nghị này. Người dùng vẫn
       * gắn tay được qua hộp thoại "+ Gắn đề nghị" (`hop-gan-de-nghi.tsx`) như bình thường.
       *
       * ⚠️ KHÔNG GỌI `vuongMacLapDonHang`/`vuongMacViecBatBuocCacBuocTruoc` Ở ĐÂY, và cũng
       * KHÔNG gọi ở bước xác nhận sau này — khác `ganDeNghiVaoPO` (gắn tay từ danh sách báo giá
       * đã chốt). Đã cân nhắc kỹ, không phải bỏ sót:
       *   · `vuongMacLapDonHang` đòi ít nhất MỘT `BaoGia` của đề nghị. `deNghiMoi` ở route này
       *     VỪA được tạo ra trong chính request này (giai đoạn ①) — CHƯA THỂ nào có `BaoGia`
       *     nào cả, vì báo giá là bước ③ làm SAU, thủ công, bên trong Thu Mua, và có thể KHÔNG
       *     BAO GIỜ xảy ra cho đề nghị này (PO đã tự đủ NCC/giá từ lúc lập độc lập). Gọi hàm
       *     này ở đây (hoặc ở bước xác nhận) luôn trả về chặn ("Chưa có bảng báo giá nào…") —
       *     tính năng tự khớp sẽ CHẾT. Kiểm soát chi tiêu của PO ĐỘC LẬP là quyền `taoPoDoiLap`
       *     (chỉ Trưởng bộ phận trở lên) ĐÃ CHẠY khi PO được TẠO (`themDonHang`) — NCC/đơn giá/
       *     hợp đồng của PO đó đã được người có thẩm quyền quyết định RỒI.
       *   · `vuongMacViecBatBuocCacBuocTruoc` soát các bước TRƯỚC bước hiện tại — `deNghiMoi`
       *     luôn ở giai đoạn ① (`viTriHienTai <= 0`) nên hàm này luôn trả `null` (không có gì
       *     để soát); gọi vào đây là code chết, không thêm an toàn nào.
       * Lớp an toàn cho đường này là XÁC NHẬN NGƯỜI THẬT (`xacNhanTuDongGanDeNghi`), không phải
       * chạy lại 2 hàm trên — mục tiêu là bắt lỗi TRÙNG MÃ DỰ ÁN NGẪU NHIÊN giữa hai công
       * trình khác nhau, không phải bắt lỗi thiếu báo giá (không áp dụng cho đường này).
       */
      const donHangHienCo: DonDatHang[] = Array.isArray(data.donHang) ? data.donHang : [];
      const chuanHoa = (s: string) => boDau(s).replace(/[^a-z0-9]/g, "");
      const ungVien = donHangHienCo.filter((po) => {
        if (po.trangThai !== "cho_de_nghi" || po.maDuAn !== deNghiMoi.maDuAn) return false;
        if (po.maHopDongCDT && deNghiMoi.maHopDongCDT) {
          const a = chuanHoa(po.maHopDongCDT);
          const b = chuanHoa(deNghiMoi.maHopDongCDT);
          /**
           * ★ NGƯỠNG ĐỘ DÀI TỐI THIỂU (6 ký tự) trước khi coi 1 chuỗi "chứa" chuỗi kia là
           * bằng chứng khớp — thêm sau review PR, phát hiện mã ngắn thuần số (vd "0001") dễ là
           * substring TRÙNG NGẪU NHIÊN của một mã hợp đồng dài không liên quan (vd "260001hpcs"),
           * biến "mâu thuẫn" thật thành "khớp" giả. Chuỗi quá ngắn thì coi như KHÔNG SO ĐƯỢC —
           * lùi về đúng nhánh "thiếu 1 bên" (bỏ qua, không tính mâu thuẫn), không suy diễn.
           */
          if (a.length >= 6 && b.length >= 6 && !a.includes(b) && !b.includes(a)) return false;
        }
        return true;
      });

      let donHangMoi = donHangHienCo;
      let poDaGan: DonDatHang | null = null;
      if (ungVien.length === 1) {
        const po = ungVien[0];
        const poMoi: DonDatHang = {
          ...po,
          prId: deNghiMoi.id,
          prCode: deNghiMoi.code,
          maDeXuatAppRequest: deNghiMoi.maDeXuatAppRequest,
          // ⚠️ GIỮ "cho_de_nghi" — KHÔNG tự chốt "da_chot". Xem khối chú thích phía trên
          // ("CHỈ ĐIỀN, KHÔNG TỰ CHỐT") và `xacNhanTuDongGanDeNghi` (`kho-du-lieu.tsx`).
          trangThai: "cho_de_nghi",
        };
        donHangMoi = donHangHienCo.map((p) => (p.id === po.id ? poMoi : p));
        poDaGan = poMoi;
        const soNgay = soNgayDaTroiQua(po.ngayLapPO);
        deNghiMoi.lichSu.push({
          thoiDiem: new Date().toISOString(),
          nguoiThucHien: "Hệ thống (tự động khớp App Request)",
          hanhDong: "Tự động điền đơn hàng đã lập trước — chờ xác nhận",
          ghiChu: `Đơn hàng ${po.code} — lập trước ${soNgay} ngày, cùng mã dự án ${po.maDuAn}. Chờ Trưởng bộ phận xác nhận ở trang chi tiết đơn hàng.`,
        });
      }

      tx.set(
        docRef,
        bo0Undefined({ deNghi: [...deNghiHienCo, deNghiMoi], donHang: donHangMoi }),
        { merge: true },
      );

      if (poDaGan) {
        // ★ MINH BẠCH — ghi thẳng bằng Admin SDK (route này không có phiên đăng nhập người
        // dùng để dùng `ghiNhatKyHeThong` phía client). Cùng collection, cùng hình dạng dữ
        // liệu — trang "Nhật ký hệ thống" đọc được bình thường, không cần biết ai ghi.
        tx.create(db.collection(TEN_COLLECTION_NHAT_KY).doc(), {
          thoiDiem: FieldValue.serverTimestamp(),
          nguoiThucHienUid: "he-thong",
          nguoiThucHienTen: "Hệ thống (tự động khớp App Request)",
          hanhDong: "tu_dong_dien_de_nghi_cho_xac_nhan",
          moTa: `Tự động điền đề nghị ${deNghiMoi.code} vào đơn hàng ${poDaGan.code} — khớp mã dự án ${poDaGan.maDuAn}. Đơn vẫn ở "Chờ đề nghị", chờ Trưởng bộ phận xác nhận.`,
        });
      }

      return { moi: true as const, deNghi: deNghiMoi };
    });

    return NextResponse.json({
      ok: true,
      trangThai: ketQua.moi ? "da_tao" : "da_ton_tai",
      deNghiId: ketQua.deNghi.id,
      maDeNghi: ketQua.deNghi.code,
    });
  } catch (error) {
    console.error("Lỗi nhận đề nghị từ App Request:", error);
    const thongBaoLoi = error instanceof Error ? error.message : "Lỗi không xác định.";
    return NextResponse.json({ ok: false, error: thongBaoLoi }, { status: 500 });
  }
}

/** Cộng thêm N ngày vào một mốc ISO "YYYY-MM-DD", trả về cùng dạng. */
function congThemNgay(iso: string, soNgay: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + soNgay);
  return d.toISOString().slice(0, 10);
}
