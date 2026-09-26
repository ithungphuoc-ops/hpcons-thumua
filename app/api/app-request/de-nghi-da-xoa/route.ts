import { NextRequest, NextResponse } from "next/server";
import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { getThuMuaDb } from "@/5-ket-noi/hpcore-may-chu";
import { DUONG_DAN, bo0Undefined } from "@/3-du-lieu/kho-chung-firestore";
import { tuMap, ghiTheoDangHienCo } from "@/2-quy-trinh/ghi-tung-phan";
import { giuThongBaoGanNhat } from "@/2-quy-trinh/giu-thong-bao";
import {
  apDungXoaTuAppRequest,
  thongBaoPoCanXuLy,
  type KetQuaXoaTuAppRequest,
} from "@/2-quy-trinh/dong-do-theo-app-request";
import type { DeNghiMuaHang, DonDatHang, ThongBaoChuyenBuoc } from "@/3-du-lieu/kieu-du-lieu";
import type { DuLieuLuu } from "@/3-du-lieu/luu-tren-may";
import { TEN_COLLECTION_NHAT_KY } from "@/3-du-lieu/nhat-ky-he-thong";

// ════════════════════════════════════════════════════════════════════════════════════════
// "CỬA BÁO XOÁ" — App Request gọi sang khi XOÁ một đề xuất (Sếp chốt 26/09/2026).
//
//   POST /api/app-request/de-nghi-da-xoa     body: { "maDeXuat": "000000157" }
//                                            (nhận cả "requestCode" — cùng tên de-nghi-moi dùng)
//
// Mọi đề nghị mang mã đó (cả họ phiếu con / nhân bản) tự sang cột Thất bại, dù đang ở bước nào.
// Đơn hàng GIỮ NGUYÊN, không tự huỷ — Trưởng bộ phận nhận tin báo đỏ để xử lý từng đơn.
// Luật nằm ở `2-quy-trinh/dong-do-theo-app-request.ts` (hàm thuần, có bài kiểm).
//
// 🔴 ĐÂY LÀ TỆP CỦA PHIÊN NGHIỆP VỤ, KHÔNG PHẢI CỦA PHIÊN TÍCH HỢP. Nó CHỈ DÙNG LẠI (import) các
// helper của họ — `getThuMuaDb`, `DUONG_DAN`, `bo0Undefined`, `APP_REQUEST_API_KEY` — không sửa
// tệp nào trong vùng cấm (CLAUDE.md §6.6). `de-nghi-moi/route.ts` không bị đụng.
//
// 📌 XÁC THỰC: đúng khuôn `de-nghi-moi/route.ts` (dòng 50–56) — header `x-api-key` so với
// `APP_REQUEST_API_KEY` NẾU đã cấu hình. 🔴 KHÁC cửa kia: chưa cấu hình khoá thì cửa này ĐÓNG (503) — xem thân POST.
//
// 📌 IDEMPOTENT: gọi lại bao nhiêu lần cũng được. Lần hai thấy cả họ đã `dong_do` thì không ghi
// gì, tin báo mang id cố định `tb-xoa-ar-{poId}` nên cũng không nhân đôi.
// ════════════════════════════════════════════════════════════════════════════════════════

type TraLoi =
  | ({ ok: true } & Pick<KetQuaXoaTuAppRequest, "daDoi" | "boQua" | "poCanXuLy">)
  | { ok: false; error: string };

export async function POST(req: NextRequest): Promise<NextResponse<TraLoi>> {
  /* ── Xác thực: CHÉP ĐÚNG khuôn de-nghi-moi/route.ts dòng 50–56. ── */
  /* 🔴 KHÁC de-nghi-moi CÓ CHỦ Ý (26/09/2026): cửa này PHÁ dữ liệu (đẩy hồ sơ thật sang Thất bại),
     nên CHƯA khai khoá thì ĐÓNG (503), không mở như cửa tạo mới. Thiếu thông tin → quyền thấp nhất. */
  const apiKeyYeuCau = (process.env.APP_REQUEST_API_KEY ?? "").trim();
  if (!apiKeyYeuCau) {
    return NextResponse.json(
      { ok: false, error: "Cửa chưa được cấu hình khoá APP_REQUEST_API_KEY — tạm đóng." },
      { status: 503 },
    );
  }
  {
    const apiKeyGui = (req.headers.get("x-api-key") ?? "").trim();
    if (apiKeyGui !== apiKeyYeuCau) {
      return NextResponse.json({ ok: false, error: "Thiếu hoặc sai x-api-key." }, { status: 401 });
    }
  }

  let payload: { maDeXuat?: unknown; requestCode?: unknown };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return NextResponse.json({ ok: false, error: "Body gửi lên không phải JSON hợp lệ." }, { status: 400 });
  }

  const tho = payload?.maDeXuat ?? payload?.requestCode;
  const maDeXuat = typeof tho === "string" || typeof tho === "number" ? String(tho).trim() : "";
  if (!maDeXuat) {
    return NextResponse.json(
      { ok: false, error: "Thiếu mã đề xuất (maDeXuat hoặc requestCode)." },
      { status: 400 },
    );
  }

  try {
    const db = getThuMuaDb();
    const docRef = db.collection(DUONG_DAN.boSuuTap).doc(DUONG_DAN.tep);
    const thoiDiem = new Date().toISOString();

    const ketQua = await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists) return null;
      const data = (snap.data() ?? {}) as Partial<DuLieuLuu>;
      const deNghiHienCo = tuMap<DeNghiMuaHang>(data.deNghi);
      const donHangHienCo = tuMap<DonDatHang>(data.donHang);

      const kq = apDungXoaTuAppRequest(deNghiHienCo, maDeXuat, thoiDiem, donHangHienCo);
      if (!kq.timThay) return kq;

      /* Tin báo chỉ sinh cho đơn CHƯA có tin (id cố định) — chốt chống trùng thật. */
      const thongBaoHienCo = tuMap<ThongBaoChuyenBuoc>(data.thongBao);
      const daCoTin = new Set(thongBaoHienCo.map((t) => t.id));
      const tinMoi = thongBaoPoCanXuLy(kq.poCanXuLy, maDeXuat, thoiDiem).filter(
        (t) => !daCoTin.has(t.id),
      );

      if (kq.deNghiDaDoi.length === 0 && tinMoi.length === 0) return kq; // gọi lại lần hai

      const laMap = (x: unknown) => x != null && typeof x === "object" && !Array.isArray(x);

      /* ── GHI TỪNG PHẦN khi kho đã ở dạng map: chạm đúng `deNghi.<id>` / `thongBao.<id>`.
         Dùng `FieldPath` chứ không ghép chuỗi "deNghi." + id — id có dấu chấm là tách sai tầng. */
      const capNhat: unknown[] = [];
      if (laMap(data.deNghi)) {
        for (const d of kq.deNghiDaDoi) capNhat.push(new FieldPath("deNghi", d.id), bo0Undefined(d));
      }
      if (laMap(data.thongBao)) {
        for (const t of tinMoi) capNhat.push(new FieldPath("thongBao", t.id), bo0Undefined(t));
      }
      if (capNhat.length > 0) {
        const [dau, giaTriDau, ...conLai] = capNhat;
        tx.update(docRef, dau as FieldPath, giaTriDau, ...conLai);
      }

      /* ── Khối nào CÒN LÀ MẢNG thì không ghi riêng được một phần tử — ghi cả khối theo đúng dạng
         hiện có, y như de-nghi-moi (`ghiTheoDangHienCo`). Xét TỪNG khối riêng. */
      const caKhoi: Record<string, unknown> = {};
      if (!laMap(data.deNghi) && kq.deNghiDaDoi.length > 0) {
        const doi = new Map(kq.deNghiDaDoi.map((d) => [d.id, d]));
        caKhoi.deNghi = ghiTheoDangHienCo(
          "deNghi",
          data.deNghi,
          deNghiHienCo.map((d) => doi.get(d.id) ?? d),
        );
      }
      if (!laMap(data.thongBao) && tinMoi.length > 0) {
        caKhoi.thongBao = ghiTheoDangHienCo(
          "thongBao",
          data.thongBao,
          giuThongBaoGanNhat([...tinMoi, ...thongBaoHienCo]),
        );
      }
      if (Object.keys(caKhoi).length > 0) {
        tx.set(docRef, bo0Undefined(caKhoi), { merge: true });
      }

      /* Minh bạch — cùng cách de-nghi-moi ghi nhật ký hệ thống bằng Admin SDK. */
      if (kq.deNghiDaDoi.length > 0) {
        tx.create(db.collection(TEN_COLLECTION_NHAT_KY).doc(), {
          thoiDiem: FieldValue.serverTimestamp(),
          nguoiThucHienUid: "he-thong",
          nguoiThucHienTen: "Hệ thống (App Request)",
          hanhDong: "tu_dong_that_bai_do_xoa_app_request",
          moTa: `Đề xuất ${maDeXuat} bị xoá ở App Request → ${kq.deNghiDaDoi
            .map((d) => d.code)
            .join(", ")} sang Thất bại.${
            kq.poCanXuLy.length
              ? ` Đơn hàng giữ nguyên, cần xử lý: ${kq.poCanXuLy.map((p) => p.poCode).join(", ")}.`
              : ""
          }`,
        });
      }
      return kq;
    });

    if (!ketQua || !ketQua.timThay) {
      return NextResponse.json(
        { ok: false, error: `Không có đề nghị nào mang mã đề xuất ${maDeXuat}.` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      daDoi: ketQua.daDoi,
      boQua: ketQua.boQua,
      poCanXuLy: ketQua.poCanXuLy,
    });
  } catch (error) {
    console.error("Lỗi xử lý đề xuất bị xoá từ App Request:", error);
    const thongBaoLoi = error instanceof Error ? error.message : "Lỗi không xác định.";
    return NextResponse.json({ ok: false, error: thongBaoLoi }, { status: 500 });
  }
}
