import { NextRequest, NextResponse } from "next/server";
import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { getThuMuaDb } from "@/5-ket-noi/hpcore-may-chu";
import { DUONG_DAN, bo0Undefined } from "@/3-du-lieu/kho-chung-firestore";
import { tuMap, ghiTheoDangHienCo } from "@/2-quy-trinh/ghi-tung-phan";
import { giuThongBaoGanNhat } from "@/2-quy-trinh/giu-thong-bao";
import {
  apDungGhiChuTuAppRequest,
  apDungKhoiPhucTuAppRequest,
  apDungXoaTuAppRequest,
  thongBaoPoCanXuLy,
} from "@/2-quy-trinh/dong-do-theo-app-request";
import type { DeNghiMuaHang, DonDatHang, ThongBaoChuyenBuoc } from "@/3-du-lieu/kieu-du-lieu";
import type { DuLieuLuu } from "@/3-du-lieu/luu-tren-may";
import { TEN_COLLECTION_NHAT_KY } from "@/3-du-lieu/nhat-ky-he-thong";

// ════════════════════════════════════════════════════════════════════════════════════════
// ★ CỬA NHẬN SỰ KIỆN SAU DUYỆT TỪ APP REQUEST — đợt 1 "liên kết 4 app" (Sếp chốt 03/10/2026).
//
//   POST /api/app-request/cap-nhat-de-nghi
//   body: { suKienId, requestId, requestCode, loai: "xoa"|"khoi_phuc"|"dieu_chinh"|"them_file",
//           luc, nguoi?, noiDung?, taiLieu?: [{ ten, url }] }
//
// Cùng 1 hợp đồng dữ liệu App Request gửi cho cả App Kho lẫn App Thu mua (hàng chờ đồng bộ bên App
// Request, lib/dong-bo/hang-cho.ts). Luật nằm ở `2-quy-trinh/dong-do-theo-app-request.ts` (hàm
// thuần, `kiem-luat-dung-chung.mjs` gọi thật):
//   · xoa        → dùng lại ĐÚNG `apDungXoaTuAppRequest` của cửa `de-nghi-da-xoa` (cả họ phiếu sang
//                  Thất bại, đơn hàng giữ nguyên + báo đỏ Trưởng bộ phận).
//   · khoi_phuc  → hồ sơ bị tự chuyển Thất bại vì việc xoá đó trở về đúng bước cũ.
//   · dieu_chinh / them_file → ghi lịch sử + nối tệp vào `taiLieuAppRequest`; bảng vật tư không đổi.
//
// 🔴 ĐÂY LÀ TỆP CỦA PHIÊN NGHIỆP VỤ, KHÔNG thuộc vùng cấm (BAN-DO-MA-NGUON.md §2b-bis) — chỉ import
// lại helper của phiên tích hợp (`getThuMuaDb`, `DUONG_DAN`, `bo0Undefined`), không sửa tệp nào của họ.
//
// 📌 XÁC THỰC: đúng khuôn `de-nghi-da-xoa` — cửa này đổi dữ liệu thật nên CHƯA khai khoá
// APP_REQUEST_API_KEY thì ĐÓNG. Trả `loaiLoi: "vinh_vien"` để App Request dừng ngay và báo Admin,
// không gửi lại vô ích (sửa cấu hình xong Admin bấm "Gửi lại ngay").
//
// 📌 Mã HTTP: 200 xong (kể cả "đã xử lý trước" / "không có đề nghị") · 400 dữ liệu sai · 5xx tạm thời.
// ════════════════════════════════════════════════════════════════════════════════════════

type Loai = "xoa" | "khoi_phuc" | "dieu_chinh" | "them_file";
const LOAI_HOP_LE: readonly Loai[] = ["xoa", "khoi_phuc", "dieu_chinh", "them_file"];

type Body = {
  suKienId?: unknown;
  requestId?: unknown;
  requestCode?: unknown;
  loai?: unknown;
  luc?: unknown;
  nguoi?: unknown;
  noiDung?: unknown;
  taiLieu?: unknown;
};

const chuoi = (x: unknown) => (typeof x === "string" ? x.trim() : "");

/**
 * Link ký sẵn App Request gửi sang (sống 5 phút) → ĐƯỜNG DẪN BỀN trong kho R2 của họ — đúng khuôn
 * `taiLieuAppRequest` mà cửa `de-nghi-moi` đang lưu (xem `duongDanTepAppRequest` ở đó: cắt phần ký,
 * bỏ `/` đầu, giải mã tên tiếng Việt). Viết lại ở đây vì hàm kia không export và nằm trong vùng cấm.
 */
function duongDanTep(ds: unknown): { ten: string; duongDan?: string }[] {
  if (!Array.isArray(ds)) return [];
  return ds
    .map((t) => {
      const ten = chuoi((t as { ten?: unknown })?.ten);
      const tho = chuoi((t as { url?: unknown })?.url);
      if (!ten) return null;
      if (!tho) return { ten };
      try {
        const duong = new URL(tho).pathname.replace(/^\/+/, "");
        return { ten, duongDan: decodeURIComponent(duong) || tho };
      } catch {
        return { ten, duongDan: tho };
      }
    })
    .filter((x): x is { ten: string; duongDan?: string } => x !== null);
}

export async function POST(req: NextRequest) {
  const apiKeyYeuCau = (process.env.APP_REQUEST_API_KEY ?? "").trim();
  if (!apiKeyYeuCau) {
    return NextResponse.json(
      { ok: false, loaiLoi: "vinh_vien", error: "Thu mua chưa cấu hình khoá APP_REQUEST_API_KEY — cửa tạm đóng." },
      { status: 503 },
    );
  }
  if ((req.headers.get("x-api-key") ?? "").trim() !== apiKeyYeuCau) {
    return NextResponse.json({ ok: false, loaiLoi: "vinh_vien", error: "Thiếu hoặc sai x-api-key." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, loaiLoi: "vinh_vien", error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }

  const suKienId = chuoi(body.suKienId);
  const maDeXuat = chuoi(body.requestCode);
  const loai = chuoi(body.loai) as Loai;
  const noiDung = chuoi(body.noiDung);
  const nguoi = chuoi(body.nguoi) || undefined;
  const tep = duongDanTep(body.taiLieu);
  if (!suKienId || !maDeXuat || !LOAI_HOP_LE.includes(loai)) {
    return NextResponse.json(
      { ok: false, loaiLoi: "vinh_vien", error: "Thiếu dữ liệu bắt buộc (suKienId / requestCode / loai hợp lệ)." },
      { status: 400 },
    );
  }
  if (loai === "dieu_chinh" && !noiDung) {
    return NextResponse.json({ ok: false, loaiLoi: "vinh_vien", error: "Điều chỉnh thiếu nội dung." }, { status: 400 });
  }
  if (loai === "them_file" && tep.length === 0) {
    return NextResponse.json({ ok: false, loaiLoi: "vinh_vien", error: "Thêm tài liệu nhưng không có tệp." }, { status: 400 });
  }

  try {
    const db = getThuMuaDb();
    const docRef = db.collection(DUONG_DAN.boSuuTap).doc(DUONG_DAN.tep);
    const thoiDiem = new Date().toISOString();

    const ketQua = await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists) return { timThay: false, daXuLyTruoc: false, daDoi: [] as string[], trangThai: "khong_co_de_nghi" };
      const data = (snap.data() ?? {}) as Partial<DuLieuLuu>;
      const deNghiHienCo = tuMap<DeNghiMuaHang>(data.deNghi);

      let deNghiDaDoi: DeNghiMuaHang[];
      let tinMoi: ThongBaoChuyenBuoc[] = [];
      let timThay: boolean;
      let daXuLyTruoc = false;
      let soBoQua = 0;
      let trangThai: string;
      let moTaNhatKy: string;

      if (loai === "xoa") {
        const donHangHienCo = tuMap<DonDatHang>(data.donHang);
        const kq = apDungXoaTuAppRequest(deNghiHienCo, maDeXuat, thoiDiem, donHangHienCo);
        deNghiDaDoi = kq.deNghiDaDoi;
        timThay = kq.timThay;
        const daCoTin = new Set(tuMap<ThongBaoChuyenBuoc>(data.thongBao).map((t) => t.id));
        tinMoi = thongBaoPoCanXuLy(kq.poCanXuLy, maDeXuat, thoiDiem).filter((t) => !daCoTin.has(t.id));
        // Hồ sơ bị bỏ qua vì CHÍNH lần xoá này đã đẩy sang Thất bại từ trước (có `trangThaiTruocXoaAR`)
        // là "đã xử lý trước", không phải "giữ nguyên vì lý do khác" (QA 03/10).
        const theoId = new Map(deNghiHienCo.map((d) => [d.id, d]));
        soBoQua = kq.boQua.filter((b) => !theoId.get(b.id)?.trangThaiTruocXoaAR).length;
        daXuLyTruoc = timThay && kq.deNghiDaDoi.length === 0;
        trangThai = "da_chuyen_that_bai";
        moTaNhatKy = `Đề xuất ${maDeXuat} bị xoá ở App Request → ${kq.deNghiDaDoi.map((d) => d.code).join(", ")} sang Thất bại.${
          kq.poCanXuLy.length ? ` Đơn hàng giữ nguyên, cần xử lý: ${kq.poCanXuLy.map((p) => p.poCode).join(", ")}.` : ""
        }`;
      } else if (loai === "khoi_phuc") {
        const kq = apDungKhoiPhucTuAppRequest(deNghiHienCo, maDeXuat, thoiDiem);
        deNghiDaDoi = kq.deNghiDaDoi;
        timThay = kq.timThay;
        soBoQua = kq.boQua.length;
        daXuLyTruoc = timThay && kq.deNghiDaDoi.length === 0;
        trangThai = "da_khoi_phuc";
        moTaNhatKy = `Đề xuất ${maDeXuat} được khôi phục ở App Request → ${kq.deNghiDaDoi.map((d) => d.code).join(", ")} trở về bước cũ.`;
      } else {
        const kq = apDungGhiChuTuAppRequest(deNghiHienCo, maDeXuat, thoiDiem, {
          suKienId,
          loai,
          nguoi,
          noiDung,
          tep,
        });
        deNghiDaDoi = kq.deNghiDaDoi;
        timThay = kq.timThay;
        daXuLyTruoc = kq.daXuLyTruoc;
        trangThai = loai === "dieu_chinh" ? "da_ghi_dieu_chinh" : "da_them_tai_lieu";
        moTaNhatKy = `Đề xuất ${maDeXuat}: ${loai === "dieu_chinh" ? "điều chỉnh sau duyệt" : "thêm tài liệu"} từ App Request → ghi vào ${kq.deNghiDaDoi
          .map((d) => d.code)
          .join(", ")}.`;
      }

      if (!timThay) return { timThay, daXuLyTruoc: false, daDoi: [] as string[], trangThai: "khong_co_de_nghi" };
      if (deNghiDaDoi.length === 0 && tinMoi.length === 0) {
        // Không đổi gì: hoặc đã áp từ trước (gửi lại), hoặc mọi hồ sơ đều thuộc diện giữ nguyên
        // (đã Hoàn thành / Thất bại vì lý do khác) — báo rõ ca sau để người đọc không hiểu nhầm.
        return {
          timThay,
          daXuLyTruoc: soBoQua === 0,
          daDoi: [] as string[],
          trangThai: soBoQua > 0 ? "giu_nguyen" : "da_xu_ly_truoc",
        };
      }

      const laMap = (x: unknown) => x != null && typeof x === "object" && !Array.isArray(x);

      /* ── GHI TỪNG PHẦN khi kho đã ở dạng map — đúng khuôn de-nghi-da-xoa: FieldPath, không ghép chuỗi. */
      const capNhat: unknown[] = [];
      if (laMap(data.deNghi)) for (const d of deNghiDaDoi) capNhat.push(new FieldPath("deNghi", d.id), bo0Undefined(d));
      if (laMap(data.thongBao)) for (const t of tinMoi) capNhat.push(new FieldPath("thongBao", t.id), bo0Undefined(t));
      if (capNhat.length > 0) {
        const [dau, giaTriDau, ...conLai] = capNhat;
        tx.update(docRef, dau as FieldPath, giaTriDau, ...conLai);
      }

      /* ── Khối còn là MẢNG thì ghi cả khối theo đúng dạng hiện có (`ghiTheoDangHienCo`). */
      const caKhoi: Record<string, unknown> = {};
      if (!laMap(data.deNghi) && deNghiDaDoi.length > 0) {
        const doi = new Map(deNghiDaDoi.map((d) => [d.id, d]));
        caKhoi.deNghi = ghiTheoDangHienCo("deNghi", data.deNghi, deNghiHienCo.map((d) => doi.get(d.id) ?? d));
      }
      if (!laMap(data.thongBao) && tinMoi.length > 0) {
        caKhoi.thongBao = ghiTheoDangHienCo(
          "thongBao",
          data.thongBao,
          giuThongBaoGanNhat([...tinMoi, ...tuMap<ThongBaoChuyenBuoc>(data.thongBao)]),
        );
      }
      if (Object.keys(caKhoi).length > 0) tx.set(docRef, bo0Undefined(caKhoi), { merge: true });

      if (deNghiDaDoi.length > 0) {
        tx.create(db.collection(TEN_COLLECTION_NHAT_KY).doc(), {
          thoiDiem: FieldValue.serverTimestamp(),
          nguoiThucHienUid: "he-thong",
          nguoiThucHienTen: "Hệ thống (App Request)",
          hanhDong: `app_request_${loai}`,
          moTa: `${moTaNhatKy} [mã sự kiện ${suKienId}]`,
        });
      }
      return { timThay, daXuLyTruoc, daDoi: deNghiDaDoi.map((d) => d.id), trangThai: daXuLyTruoc ? "da_xu_ly_truoc" : trangThai };
    });

    return NextResponse.json({ ok: true, trangThai: ketQua.trangThai, daDoi: ketQua.daDoi });
  } catch (error) {
    console.error("Lỗi nhận sự kiện sau duyệt từ App Request:", error);
    return NextResponse.json(
      { ok: false, loaiLoi: "tam_thoi", error: error instanceof Error ? error.message : "Lỗi không xác định." },
      { status: 503 },
    );
  }
}
