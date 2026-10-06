import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getThuMuaDb, verifyClientIdToken } from "@/5-ket-noi/hpcore-may-chu";
import { nguoiBiKhoaVaoApp, quyenRiengConHieuLuc, tinhQuyen } from "@/4-phan-quyen/quyen";
import {
  chuanHoaQuyenRieng,
  dauChucDanhCua,
  khopDauChucDanh,
  TOI_DA_NGUOI_MOI_LAN,
  type BanGhiQuyenRiengHienThi,
} from "@/4-phan-quyen/quyen-rieng";
import { oDeCuaHoSo } from "@/4-phan-quyen/mau-chuc-danh";
import {
  coQuyenPhanQuyen,
  HANH_DONG_NHAT_KY,
  tinhLuuQuyenRieng,
  type KetQuaLuuQuyenRieng,
  type NguoiNhanLuu,
  type YeuCauQuyenRieng,
} from "@/4-phan-quyen/tinh-luu-phan-quyen";
import { TEN_COLLECTION_NHAT_KY } from "@/3-du-lieu/nhat-ky-he-thong";
import {
  banGhiTuAnh,
  docTatCaKemHoSo,
  laLoiMauHong,
  laOwner,
  layIdToken,
  MA_HOP_LE,
  mauTuAnh,
  nguoiDungTuAnh,
  nguoiGoiTuAnh,
  refHoSo,
  refMau,
  refRieng,
} from "@/5-ket-noi/phan-quyen-may-chu";

// ============================================================
// CỬA QUYỀN TICK RIÊNG — Sếp 26/09/2026 (màn "Phân quyền người dùng" kiểu tick chọn)
// ★ Sếp 06/10/2026 (mẫu chức danh sửa được · Câu 1 = A · Câu 2 = B · Câu 3 = A): quyền trả về và
// quyền dùng để gác đều ĐÃ GỘP MẪU; bản ghi mới là KHUÔN 2 (chỉ ô ngoại lệ); "Bỏ quyền riêng" xoá bản
// ghi; mọi lần ghi để lại một dòng Nhật ký hệ thống TRONG CÙNG GIAO DỊCH.
//
// 📌 ROUTE CỦA PHIÊN NGHIỆP VỤ, KHÔNG PHẢI CỦA PHIÊN TÍCH HỢP. Chỉ GỌI các hàm/hằng export của
// `hpcore-may-chu.ts` / `ho-so-tai-khoan.ts` (vùng của phiên tích hợp — CLAUDE.md §6.6), không sửa.
// Phần đọc vé / hồ sơ / bản ghi / mẫu dùng chung với cửa sửa mẫu nằm ở `5-ket-noi/phan-quyen-may-chu.ts`.
//
// 🔴 CẤT Ở COLLECTION RIÊNG `tm_quyen_rieng/{firebaseUid}`, KHÔNG ghi vào `nguoi-dung/{uid}`:
//   · `nguoi-dung` là schema của phiên tích hợp (đường ghi duy nhất là `/api/phan-quyen`).
//   · KHÔNG cất ở `chay-thu/du-lieu-chung`: ai đăng nhập cũng ghi được tài liệu đó → ai cũng tự
//     tick quyền cho mình được.
//   · Rules đang chạy (`5-ket-noi/firestore-gop-tach.rules`) có khối `match /{document=**}` chặn
//     mọi collection không khai báo → trình duyệt KHÔNG đọc/ghi thẳng được `tm_quyen_rieng`, chỉ
//     route này (Admin SDK) chạm được.
//
// 🔴 QUYỀN NGƯỜI GỌI TÍNH Ở MÁY CHỦ, LUÔN QUA MẪU (bổ sung đặc tả C-F1): chức danh từ hồ sơ + ô đè mẫu
// + ngoại lệ riêng của CHÍNH họ (`nguoiGoiTuAnh`), không tin trình duyệt tự khai.
//
// 🔴 KHÔNG VIẾT LUẬT Ở ĐÂY: ghi gì / xoá gì / chặn vì sao do `tinhLuuQuyenRieng` (hàm thuần, kho demo
// gọi y hệt) quyết định. Route chỉ đọc, trao dữ liệu, rồi áp đúng kết quả.
//
// 🔴 BẢN GHI TỒN TẠI MÀ SAI KHUÔN → NÉM LỖI, không coi là "chưa có" (soát chéo lần 2 26/09/2026).
// 🔴 MẪU HỎNG → 500 `maLoi:"mau-hong"`, KHÔNG BAO GIỜ trả `quyenRieng: null` (null = theo chức danh =
// rộng hơn). Trình duyệt gặp lỗi thì chặn vào app (CLAUDE.md §3.6c); Quản trị cứu mẫu ở cửa sửa mẫu.
// ============================================================

/**
 * ★★ CHẠY Ở SINGAPORE (`sin1`) — Sếp 27/09/2026 *"e làm luôn đi"* (màn Phân quyền chờ ~3 giây).
 *
 * Đo được: function mặc định chạy ở `iad1` (Washington, header `x-vercel-id: hkg1::iad1::…`), trong khi
 * Firestore `hpcons-thumua` ở `asia-southeast1` (Singapore) — mỗi lượt đọc vượt Thái Bình Dương ~0,2s.
 * CHỈ đặt cho cửa của phiên nghiệp vụ; cửa của phiên tích hợp giữ vùng mặc định.
 *
 * 🔴 Cửa này nằm trên ĐƯỜNG ĐĂNG NHẬP của mọi người không phải Quản trị (`nguoi-dung-hien-tai.tsx`) —
 * hỏng là họ không vào được app. Sau mỗi lần đổi phải đo lại `x-vercel-id` + `npm run kiem-route`;
 * sự cố thì Instant Rollback trên Vercel. Gói Vercel không cho đặt vùng riêng thì dòng này vô hại.
 * ⚠️ ĐO SAU KHI ĐẨY (27/09/2026, commit 6f37299): header VẪN `hkg1::iad1` → gói Vercel hiện KHÔNG nhận vùng
 * riêng từng route. Giữ dòng (vô hại, tự có tác dụng nếu nâng gói). Muốn nhanh hẳn phải đổi vùng mặc định
 * CẢ project sang `sin1` — kéo theo cửa của phiên tích hợp, phải thống nhất với họ trước.
 */
export const preferredRegion = "sin1";

/** Câu trả 500 khi mẫu hỏng — `maLoi` để trình duyệt nói đúng lý do (chặn vào app, trừ Quản trị). */
function traLoiMauHong(e: Error) {
  return NextResponse.json(
    { error: `Bảng mẫu quyền theo chức danh đang hỏng — nhờ Quản trị khôi phục. (${e.message})`, maLoi: "mau-hong" },
    { status: 500 },
  );
}

/**
 * GET — quyền HIỆU LỰC của chính người gọi (mỗi lần tải trang, `nguoi-dung-hien-tai.tsx`): ĐỦ 18 ô đã
 * gộp mẫu + ngoại lệ. `null` CHỈ khi chức danh không có ô đè mẫu VÀ người đó không có bản ghi.
 *
 * 📌 Một `getAll` đọc cùng lượt hồ sơ + bản riêng + mẫu (vai trò toàn cục App Tổng đã cache 30s).
 *
 * `?tatCa=1` → thêm bản đồ quyền riêng của MỌI người (kèm `quyenHieuLuc` đã gộp mẫu, `lechChucDanh`),
 * `mau` và `canhBaoMau` — chỉ cho người có quyền phân quyền.
 * `?biKhoa=1` → danh sách mã nghiệp vụ người bị bỏ "Vào app" (giữ nguyên như 26/09/2026).
 *
 * 🔴 Không đọc được hồ sơ người gọi → 403, KHÔNG trả `quyenRieng: null`. Mẫu hỏng → 500 `mau-hong`.
 */
export async function GET(req: NextRequest) {
  const caller = await verifyClientIdToken(layIdToken(req));
  if (!caller) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const db = getThuMuaDb();
    const thamSo = req.nextUrl.searchParams;
    /* ★ Đọc trước "mọi bản ghi quyền riêng" SONG SONG với bước kiểm người gọi (27/09/2026) — trước đây
       nối tiếp nên `?tatCa=1` tốn 3 lượt đi-về, nay còn 2. Chỉ ĐỌC trước, KHÔNG trả ra: kết quả chỉ
       dùng sau khi người gọi qua đủ bước kiểm quyền bên dưới. Lỗi được giữ lại rồi ném ĐÚNG chỗ dùng —
       người không đủ quyền vẫn nhận 403 chứ không nhận 500 vì một bản ghi hỏng họ không được xem. */
    const huaTatCa =
      thamSo.get("tatCa") === "1" || thamSo.get("biKhoa") === "1"
        ? docTatCaKemHoSo().then(
            (v) => ({ ok: true as const, v }),
            (e: unknown) => ({ ok: false as const, e }),
          )
        : null;
    const layTatCa = async () => {
      const kq = await huaTatCa;
      if (!kq) return docTatCaKemHoSo();
      if (!kq.ok) throw kq.e;
      return kq.v;
    };
    const [owner, [anhHoSo, anhRieng, anhMau]] = await Promise.all([
      laOwner(caller.uid),
      db.getAll(refHoSo(caller.uid), refRieng(caller.uid), refMau()),
    ]);
    const hs = nguoiDungTuAnh(caller.uid, owner, anhHoSo);
    if (!hs || !hs.dangLamViec) {
      return NextResponse.json({ error: "Bạn chưa được cấp quyền ở app Thu mua." }, { status: 403 });
    }
    /* Mẫu đọc kèm dấu vết từ bản ghi CỦA MÌNH (C-F3): mẫu vắng mà bản của mình mang `phienBanMau ≥ 1`
       → hỏng. Ném `LoiMauHong` → 500 `mau-hong` ở `catch`. */
    const { mau } = mauTuAnh(anhMau, [banGhiTuAnh(caller.uid, anhRieng)]);
    const goi = nguoiGoiTuAnh(caller.uid, owner, anhHoSo, anhRieng, mau);
    if (!goi) {
      return NextResponse.json({ error: "Bạn chưa được cấp quyền ở app Thu mua." }, { status: 403 });
    }
    const riengCuaToi = goi.nguoiDung.quyenRieng ?? null;

    /**
     * ★ `?biKhoa=1` — danh sách MÃ NGHIỆP VỤ của người đang bị bỏ "Vào app" (quyền hiệu lực), cho danh
     * sách "Giao việc cho ai" ở `bang-phan-bo.tsx` lọc họ ra. Sếp 26/09/2026 *"Nối vào ô tíck"*.
     *
     * 📌 Mở cho người có quyền GIAO VIỆC (`phanBoCongViec`, đã gộp mẫu) chứ không chỉ người phân quyền —
     * vì ô "Giao việc" tick được cho người cấp 2, mà họ không đọc được `?tatCa=1`. Trả ĐÚNG một danh
     * sách mã, không trả bản ghi quyền của ai. "Vào app" là ô KHOÁ trên bảng mẫu nên `nguoiBiKhoaVaoApp`
     * không cần mẫu (`quyen.ts`).
     */
    if (thamSo.get("biKhoa") === "1") {
      const qGoi = tinhQuyen(goi.nguoiDung);
      if (!qGoi.phanBoCongViec && !coQuyenPhanQuyen(goi.nguoiDung)) {
        return NextResponse.json({ error: "Bạn không có quyền giao việc." }, { status: 403 });
      }
      const khongVaoApp: string[] = [];
      for (const { b, hs: chu } of await layTatCa()) {
        if (chu && nguoiBiKhoaVaoApp(chu.nguoiDung, b)) khongVaoApp.push(chu.nguoiDung.uid);
      }
      return NextResponse.json({ ok: true, quyenRieng: riengCuaToi, khongVaoApp });
    }

    if (thamSo.get("tatCa") !== "1") {
      return NextResponse.json({ ok: true, quyenRieng: riengCuaToi });
    }

    if (!coQuyenPhanQuyen(goi.nguoiDung)) {
      return NextResponse.json({ error: "Bạn không có quyền phân quyền người dùng." }, { status: 403 });
    }

    const dsTatCa = await layTatCa();
    /* C-F3: mẫu vắng + BẤT KỲ bản ghi nào (kể cả mồ côi) mang `phienBanMau ≥ 1` → hỏng. Cùng ảnh mẫu đã
       đọc ở trên — chỉ thêm dấu vết, không đọc lại. */
    const docMau = mauTuAnh(anhMau, dsTatCa.map((x) => x.b));
    const tatCa: Record<string, BanGhiQuyenRiengHienThi> = {};
    for (const { uid, b, hs: chu } of dsTatCa) {
      if (!chu) continue; // mồ côi: không liệt kê người (màn Phân quyền và Giao việc cũng không hiện)
      tatCa[uid] = {
        ...b,
        quyenHieuLuc: quyenRiengConHieuLuc(b, chu.nguoiDung, oDeCuaHoSo(docMau.mau, chu.nguoiDung)) ?? {},
        lechChucDanh: !khopDauChucDanh(b.theoChucDanh, dauChucDanhCua(chu.nguoiDung)),
      };
    }
    return NextResponse.json({ ok: true, quyenRieng: riengCuaToi, tatCa, mau: docMau.mau, canhBaoMau: docMau.canhBao });
  } catch (e) {
    if (laLoiMauHong(e)) {
      console.error("[api/quyen-rieng] GET — mẫu chức danh hỏng:", e);
      return traLoiMauHong(e);
    }
    console.error("[api/quyen-rieng] GET hỏng:", e);
    return NextResponse.json({ error: "Không đọc được quyền riêng." }, { status: 500 });
  }
}

/** Kết quả giao dịch POST: kết quả lỗi của hàm thuần, hoặc số đã áp. */
type KetQuaGiaoDich =
  | Extract<KetQuaLuuQuyenRieng, { ok: false }>
  | { ok: true; soDaGhi: number; soDaXoa: number; soGiuNguyen: number };

/**
 * POST — lưu cho NHIỀU người một lần (đặc tả 2.5):
 *   `{ targetUids: string[] (1..50), phienBanMau: number, quyen?: QuyenRieng, boQuyenRieng?: true }`
 * — đúng MỘT trong hai `quyen` (tick: PHẦN THAY ĐỔI, chỉ các ô đã chạm) / `boQuyenRieng` (về theo chức
 * danh + mẫu: xoá bản ghi).
 *
 * 🔴 `phienBanMau` BẮT BUỘC: thiếu → 400 `maLoi:"ban-cu"` (trang đang mở là bản giao diện cũ). Lệch mẫu
 * đang cất → 409 `maLoi:"mau-doi"` (do `tinhLuuQuyenRieng`) — tab cũ gửi bản nháp dựng theo mẫu cũ là
 * trả lại đúng cờ Sếp vừa bỏ ở mẫu.
 *
 * 🔴 TẤT CẢ HOẶC KHÔNG, TRONG MỘT GIAO DỊCH (soát chéo lần 2 26/09/2026): đọc hồ sơ + bản ghi của
 * người gọi, MẪU, hồ sơ + bản ghi của mọi người nhận; tính bằng `tinhLuuQuyenRieng`; ghi / xoá; ghi
 * nhật ký — cả trong `runTransaction`. Hai người lưu cùng lúc (hoặc có người vừa sửa mẫu / đổi chức
 * danh) thì Firestore bắt tranh chấp và chạy lại lượt sau trên dữ liệu mới, không ai đè ai.
 */
export async function POST(req: NextRequest) {
  /* Kiểm vé TRƯỚC khi đọc thân yêu cầu — `kiem-route` gửi `{}` và phải nhận 401 kèm JSON. */
  const caller = await verifyClientIdToken(layIdToken(req));
  if (!caller) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Thân yêu cầu không phải JSON object." }, { status: 400 });
  }
  /* Bản giao diện trước 06/10/2026 không gửi trường này — nói thẳng "tải lại trang" thay vì một câu khuôn
     chung chung (đặc tả 2.5). */
  if (body.phienBanMau === undefined) {
    return NextResponse.json(
      { error: "Trang đang mở là bản cũ — tải lại trang rồi làm lại.", maLoi: "ban-cu" },
      { status: 400 },
    );
  }
  const phienBanMau = body.phienBanMau;
  if (typeof phienBanMau !== "number" || !Number.isInteger(phienBanMau) || phienBanMau < 0) {
    return NextResponse.json({ error: "phienBanMau phải là số nguyên ≥ 0." }, { status: 400 });
  }

  const dsUid = Array.isArray(body.targetUids) ? (body.targetUids as unknown[]) : null;
  if (!dsUid || dsUid.length === 0) {
    return NextResponse.json({ error: "Thiếu danh sách targetUids." }, { status: 400 });
  }
  if (dsUid.length > TOI_DA_NGUOI_MOI_LAN) {
    return NextResponse.json(
      { error: `Mỗi lần lưu tối đa ${TOI_DA_NGUOI_MOI_LAN} người — chia nhỏ rồi lưu lại.` },
      { status: 400 },
    );
  }
  if (!dsUid.every((x) => typeof x === "string" && MA_HOP_LE.test(x))) {
    return NextResponse.json({ error: "Có mã người nhận không hợp lệ." }, { status: 400 });
  }
  const targetUids = [...new Set(dsUid as string[])];

  const coQuyen = body.quyen !== undefined;
  const coBo = body.boQuyenRieng !== undefined;
  if (coQuyen === coBo) {
    return NextResponse.json(
      { error: "Phải có đúng một trong hai trường: quyen (tick) hoặc boQuyenRieng (về theo chức danh)." },
      { status: 400 },
    );
  }
  let yeuCau: YeuCauQuyenRieng;
  if (coBo) {
    if (body.boQuyenRieng !== true) {
      return NextResponse.json({ error: "boQuyenRieng chỉ nhận giá trị true." }, { status: 400 });
    }
    yeuCau = { loai: "bo-quyen-rieng" };
  } else {
    const ch = chuanHoaQuyenRieng(body.quyen);
    if (!ch) {
      return NextResponse.json({ error: "Thiếu quyen." }, { status: 400 });
    }
    /* Khoá lạ = trình duyệt gửi nhầm (hoặc bản giao diện lệch bản máy chủ). TỪ CHỐI chứ không lờ đi:
       lờ đi là người dùng tưởng đã lưu cờ đó. `phanQuyenNguoiDung` và `xuatHoSo` rơi vào đây từ
       26/09/2026 — hai cờ đó không tick được nữa (xem `CO_TICK_DUOC`). */
    if (ch.boQua.length > 0) {
      return NextResponse.json({ error: `Khoá quyền không hợp lệ: ${ch.boQua.join(", ")}.` }, { status: 400 });
    }
    if (Object.keys(ch.quyen).length === 0) {
      return NextResponse.json({ error: "Chưa có thay đổi nào để lưu." }, { status: 400 });
    }
    yeuCau = { loai: "tick", thayDoi: ch.quyen };
  }
  if (targetUids.includes(caller.uid)) {
    return NextResponse.json(
      { error: "Không tự sửa quyền của chính mình. Nhờ một tài khoản Quản trị khác đổi giúp." },
      { status: 403 },
    );
  }

  try {
    const db = getThuMuaDb();

    // ---------- ① Người gọi có quyền phân quyền không — kiểm TRƯỚC khi đọc hồ sơ người nhận ----------
    const ownerGoi = await laOwner(caller.uid);
    const [anhHoSoGoi, anhRiengGoi, anhMauTruoc] = await db.getAll(
      refHoSo(caller.uid),
      refRieng(caller.uid),
      refMau(),
    );
    const hsGoi = nguoiDungTuAnh(caller.uid, ownerGoi, anhHoSoGoi);
    if (!hsGoi || !hsGoi.dangLamViec) {
      return NextResponse.json({ error: "Bạn chưa được cấp quyền ở app Thu mua." }, { status: 403 });
    }
    const mauTruoc = mauTuAnh(anhMauTruoc, [banGhiTuAnh(caller.uid, anhRiengGoi)]).mau;
    const goiTruoc = nguoiGoiTuAnh(caller.uid, ownerGoi, anhHoSoGoi, anhRiengGoi, mauTruoc);
    if (!goiTruoc || !coQuyenPhanQuyen(goiTruoc.nguoiDung)) {
      return NextResponse.json({ error: "Bạn không có quyền phân quyền người dùng." }, { status: 403 });
    }

    /* Vai trò toàn cục App Tổng nằm ở PROJECT KHÁC (`users` của hpcons-portal) nên không vào được
       giao dịch của project Thu mua — đọc trước, ngoài giao dịch (đã cache 30s). */
    const ownerDich = await Promise.all(targetUids.map((u) => laOwner(u)));

    // ---------- ② Đọc + tính + ghi + nhật ký trong MỘT giao dịch ----------
    const kq = await db.runTransaction(async (tx): Promise<KetQuaGiaoDich> => {
      const n = targetUids.length;
      const anh = await tx.getAll(
        refHoSo(caller.uid),
        refRieng(caller.uid),
        refMau(),
        ...targetUids.map(refHoSo),
        ...targetUids.map(refRieng),
      );

      /* Bản ghi đọc TRONG giao dịch — sai khuôn thì NÉM (cả giao dịch hỏng, không ghi gì). */
      const banGhiGoi = banGhiTuAnh(caller.uid, anh[1]);
      const banGhiNhan = targetUids.map((u, i) => banGhiTuAnh(u, anh[3 + n + i]));
      /* MẪU ĐỌC TRONG GIAO DỊCH — có người vừa sửa mẫu thì giao dịch chạy lại trên mẫu mới, và phép so
         `phienBanMau` trong `tinhLuuQuyenRieng` thấy đúng bản đang cất. Dấu vết: mọi bản ghi vừa đọc. */
      const { mau } = mauTuAnh(anh[2], [banGhiGoi, ...banGhiNhan]);

      /* Đọc lại người gọi TRONG giao dịch, QUA MẪU — quyền của họ có thể vừa đổi sau bước ①. */
      const nguoiGoi = nguoiGoiTuAnh(caller.uid, ownerGoi, anh[0], anh[1], mau);
      if (!nguoiGoi) {
        return { ok: false, status: 403, error: "Bạn chưa được cấp quyền ở app Thu mua." };
      }

      const nhan: NguoiNhanLuu[] = [];
      for (let i = 0; i < n; i++) {
        const u = targetUids[i];
        const hs = nguoiDungTuAnh(u, ownerDich[i], anh[3 + i]);
        if (!hs) {
          return {
            ok: false,
            status: 404,
            error: `Có người chưa có hồ sơ ở app Thu mua (mã ${u}) — gán chức danh trước rồi mới tick quyền.`,
          };
        }
        nhan.push({ uid: u, nd: hs.nguoiDung, banGhi: banGhiNhan[i] });
      }

      /* 🔴 MỘT PHÉP TÍNH CHO CẢ MÁY CHỦ LẪN KHO DEMO. Bản ghi khuôn 2 (kèm `theoChucDanh` từ hồ sơ VỪA
         ĐỌC, `quyen` đủ 18 ô cho bản mã cũ khi rollback, `phienBanMau` — C-F5) do hàm thuần dựng; route
         ghi NGUYÊN bản đó, không tự dựng lại. */
      const tinh = tinhLuuQuyenRieng({
        nguoiGoi,
        nhan,
        mau,
        phienBanMauGui: phienBanMau,
        yeuCau,
        luc: new Date().toISOString(),
        capNhatBoi: caller.uid,
        capNhatBoiTen: nguoiGoi.nguoiDung.tenHienThi,
      });
      if (!tinh.ok) return tinh;

      for (const g of tinh.ghi) tx.set(refRieng(g.uid), g.banGhi);
      for (const u of tinh.xoa) tx.delete(refRieng(u));
      /* Nhật ký TRONG CÙNG GIAO DỊCH (tiền lệ `app/api/app-request/de-nghi-da-xoa/route.ts`): ghi được thì
         có dòng, hỏng thì cả lần lưu hỏng — không có lần đổi quyền nào không để lại dấu. Chỉ `create`
         (Admin SDK bỏ qua rules "chỉ tạo, không sửa", route phải tự giữ). `nguoiThucHienUid` = MÃ NGHIỆP
         VỤ theo quy ước nhật ký (owner không có hồ sơ thì là mã Firebase). Không ghi gì thì không có dòng. */
      if (tinh.ghi.length + tinh.xoa.length > 0) {
        tx.create(db.collection(TEN_COLLECTION_NHAT_KY).doc(), {
          thoiDiem: FieldValue.serverTimestamp(),
          nguoiThucHienUid: nguoiGoi.nguoiDung.uid,
          nguoiThucHienTen: nguoiGoi.nguoiDung.tenHienThi,
          hanhDong: yeuCau.loai === "tick" ? HANH_DONG_NHAT_KY.tick : HANH_DONG_NHAT_KY.bo,
          moTa: tinh.moTaNhatKy,
        });
      }
      return {
        ok: true,
        soDaGhi: tinh.ghi.length,
        soDaXoa: tinh.xoa.length,
        soGiuNguyen: tinh.giuNguyen.length,
      };
    });

    if (!kq.ok) {
      return NextResponse.json(
        { error: kq.error, ...(kq.maLoi ? { maLoi: kq.maLoi } : {}) },
        { status: kq.status },
      );
    }
    return NextResponse.json({
      ok: true,
      soDaGhi: kq.soDaGhi,
      soDaXoa: kq.soDaXoa,
      soGiuNguyen: kq.soGiuNguyen,
    });
  } catch (e) {
    if (laLoiMauHong(e)) {
      console.error("[api/quyen-rieng] POST — mẫu chức danh hỏng:", e);
      return traLoiMauHong(e);
    }
    console.error("[api/quyen-rieng] POST hỏng:", e);
    return NextResponse.json({ error: "Không lưu được quyền riêng. Thử lại sau." }, { status: 500 });
  }
}
