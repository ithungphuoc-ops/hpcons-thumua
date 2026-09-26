import { NextRequest, NextResponse } from "next/server";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { fetchVaiTroToanCuc, getThuMuaDb, verifyClientIdToken } from "@/5-ket-noi/hpcore-may-chu";
import {
  BO_SUU_TAP_NGUOI_DUNG,
  hopLe,
  thanhNguoiDung,
  type HoSoTaiKhoan,
} from "@/5-ket-noi/ho-so-tai-khoan";
import {
  nguoiBiKhoaVaoApp,
  quyenRiengConHieuLuc,
  tinhQuyen,
  tinhQuyenTheoChucDanh,
  type NguoiDung,
} from "@/4-phan-quyen/quyen";
import { VAI_TRO_CHUAN } from "@/4-phan-quyen/vai-tro-chuan";
import {
  capDatDuocToiDa,
  vuongMacTraoQuyen,
  type DichTraoQuyen,
} from "@/4-phan-quyen/luat-phan-quyen";
import {
  BO_SUU_TAP_QUYEN_RIENG,
  chuanHoaDauChucDanh,
  chuanHoaQuyenRieng,
  dauChucDanhCua,
  khopDauChucDanh,
  tinhTruocSauKhiLuu,
  TOI_DA_NGUOI_MOI_LAN,
  type BanGhiQuyenRieng,
  type BanGhiQuyenRiengHienThi,
  type QuyenRieng,
} from "@/4-phan-quyen/quyen-rieng";

// ============================================================
// CỬA QUYỀN TICK RIÊNG — Sếp 26/09/2026 (màn "Phân quyền người dùng" kiểu tick chọn)
//
// 📌 ROUTE CỦA PHIÊN NGHIỆP VỤ, KHÔNG PHẢI CỦA PHIÊN TÍCH HỢP. Chỉ GỌI các hàm/hằng export của
// `hpcore-may-chu.ts` / `ho-so-tai-khoan.ts` (vùng của phiên tích hợp — CLAUDE.md §6.6), không sửa.
// Cách xác thực và cách nhận diện owner chép đúng khuôn `app/api/phan-quyen/route.ts`.
//
// 🔴 CẤT Ở COLLECTION RIÊNG `tm_quyen_rieng/{firebaseUid}`, KHÔNG ghi vào `nguoi-dung/{uid}`:
//   · `nguoi-dung` là schema của phiên tích hợp (đường ghi duy nhất là `/api/phan-quyen`).
//   · KHÔNG cất ở `chay-thu/du-lieu-chung`: ai đăng nhập cũng ghi được tài liệu đó → ai cũng tự
//     tick quyền cho mình được.
//   · Rules đang chạy (`5-ket-noi/firestore-gop-tach.rules`) có khối `match /{document=**}` chặn
//     mọi collection không khai báo → trình duyệt KHÔNG đọc/ghi thẳng được `tm_quyen_rieng`, chỉ
//     route này (Admin SDK) chạm được.
//
// 🔴 QUYỀN NGƯỜI GỌI TÍNH Ở MÁY CHỦ, không tin trình duyệt tự khai: chức danh từ hồ sơ + quyền
// riêng của CHÍNH họ, rồi hỏi `vuongMacTraoQuyen` — đúng hàm màn hình dùng để khoá ô.
//
// 🔴 MỌI CHỖ ĐỌC BẢN GHI ĐỀU ĐỐI CHIẾU DẤU CHỨC DANH (`quyenRiengConHieuLuc`) — soát chéo 26/09/2026.
//
// 🔴 BẢN GHI TỒN TẠI MÀ SAI KHUÔN → NÉM LỖI, không coi là "chưa có" (soát chéo lần 2 26/09/2026).
// "Chưa có bản ghi" nghĩa là "theo chức danh" — quyền RỘNG hơn. Coi hỏng là chưa có thì một tài liệu
// hỏng trả lại cho người ta mọi thứ đã bị bỏ. Ném lỗi thì GET trả 500 và trình duyệt chặn vào app.
// ============================================================

function layIdToken(req: NextRequest): string | undefined {
  const m = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  return m?.[1];
}

/** Mã Firebase hợp lệ để làm id tài liệu — chặn chuỗi có `/` hay ký tự lạ lọt vào đường dẫn. */
const MA_HOP_LE = /^[A-Za-z0-9_-]{1,128}$/;

const refHoSo = (uid: string) => getThuMuaDb().collection(BO_SUU_TAP_NGUOI_DUNG).doc(uid);
const refRieng = (uid: string) => getThuMuaDb().collection(BO_SUU_TAP_QUYEN_RIENG).doc(uid);

/** Đọc một tài liệu quyền riêng đã cất. Sai khuôn → `null` (nơi gọi quyết định ném hay bỏ). */
function docBanGhi(raw: unknown): BanGhiQuyenRieng | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const q = chuanHoaQuyenRieng(d.quyen);
  if (!q) return null;
  return {
    quyen: q.quyen,
    theoChucDanh: chuanHoaDauChucDanh(d.theoChucDanh),
    capNhatLuc: typeof d.capNhatLuc === "string" ? d.capNhatLuc : "",
    capNhatBoi: typeof d.capNhatBoi === "string" ? d.capNhatBoi : "",
    capNhatBoiTen: typeof d.capNhatBoiTen === "string" ? d.capNhatBoiTen : undefined,
  };
}

/** Bản ghi từ ảnh tài liệu: không tồn tại → `null`; tồn tại mà sai khuôn → NÉM (xem đầu tệp). */
function banGhiTuAnh(uid: string, anh: DocumentSnapshot | undefined): BanGhiQuyenRieng | null {
  if (!anh?.exists) return null;
  const b = docBanGhi(anh.data());
  if (!b) throw new Error(`${BO_SUU_TAP_QUYEN_RIENG}/${uid} sai khuôn — không đoán thành "chưa có".`);
  return b;
}

/**
 * Hồ sơ nghiệp vụ từ ảnh tài liệu `nguoi-dung/{uid}`. `null` = chưa có hồ sơ hợp lệ ở app Thu mua.
 *
 * 📌 Owner App Tổng → toàn quyền như Quản trị, BẤT KỂ hồ sơ riêng — đúng ngoại lệ ở
 * `docHoSoTaiKhoan()` (trình duyệt) và `app/api/phan-quyen` (máy chủ).
 */
function nguoiDungTuAnh(
  uid: string,
  laOwner: boolean,
  anh: DocumentSnapshot | undefined,
): { nguoiDung: NguoiDung; dangLamViec: boolean } | null {
  if (laOwner) {
    const quanTri = VAI_TRO_CHUAN.find((v) => v.ma === "quan_tri")!;
    return {
      nguoiDung: {
        uid,
        tenHienThi: "Chủ sở hữu hệ thống",
        chucDanh: "—",
        phongBan: "—",
        chucNang: quanTri.chucNang,
        vaiTro: quanTri.vaiTro,
        capTM: quanTri.capTM,
        capKho: quanTri.capKho,
      },
      dangLamViec: true,
    };
  }
  const hs = (anh?.exists ? anh.data() : undefined) as Partial<HoSoTaiKhoan> | undefined;
  if (!hopLe(hs)) return null;
  return { nguoiDung: thanhNguoiDung(hs), dangLamViec: hs.dangLamViec !== false };
}

const laOwner = async (uid: string) => (await fetchVaiTroToanCuc(uid)) === "owner";

/**
 * Người gọi + quyền hiệu lực của họ (chức danh + quyền riêng đã đối chiếu dấu). `null` = không có hồ
 * sơ hợp lệ / đang tạm ngưng.
 */
function nguoiGoiTuAnh(
  uid: string,
  owner: boolean,
  anhHoSo: DocumentSnapshot | undefined,
  anhRieng: DocumentSnapshot | undefined,
): { uid: string; nguoiDung: NguoiDung } | null {
  const goi = nguoiDungTuAnh(uid, owner, anhHoSo);
  if (!goi || !goi.dangLamViec) return null;
  const rieng = quyenRiengConHieuLuc(banGhiTuAnh(uid, anhRieng), goi.nguoiDung);
  return { uid, nguoiDung: { ...goi.nguoiDung, quyenRieng: rieng } };
}

/**
 * MỌI bản ghi quyền riêng kèm hồ sơ của chủ nó. Bản ghi mồ côi (không còn hồ sơ) bị bỏ — màn Phân
 * quyền và danh sách Giao việc cũng không liệt kê người đó.
 *
 * 🔴 Bản ghi sai khuôn ở đây cũng NÉM (xem đầu tệp) — nơi gọi nhận lỗi, thay vì coi người đó "theo
 * chức danh" trong khi họ đang bị bỏ bớt quyền.
 */
async function docTatCaKemHoSo(): Promise<
  { uid: string; b: BanGhiQuyenRieng; hs: { nguoiDung: NguoiDung; dangLamViec: boolean } }[]
> {
  const db = getThuMuaDb();
  const ds = await db.collection(BO_SUU_TAP_QUYEN_RIENG).get();
  const banGhi = ds.docs.map((d) => ({ uid: d.id, b: banGhiTuAnh(d.id, d) as BanGhiQuyenRieng }));
  if (banGhi.length === 0) return [];
  const [anhHoSo, owner] = await Promise.all([
    db.getAll(...banGhi.map((x) => refHoSo(x.uid))),
    Promise.all(banGhi.map((x) => laOwner(x.uid))),
  ]);
  const ra: { uid: string; b: BanGhiQuyenRieng; hs: { nguoiDung: NguoiDung; dangLamViec: boolean } }[] = [];
  banGhi.forEach(({ uid, b }, i) => {
    const hs = nguoiDungTuAnh(uid, owner[i], anhHoSo[i]);
    if (hs) ra.push({ uid, b, hs });
  });
  return ra;
}

/** Người gọi có quyền phân quyền không — cùng hai điều kiện màn hình và `/api/phan-quyen` dùng. */
function coQuyenPhanQuyen(nd: NguoiDung): boolean {
  return tinhQuyen(nd).phanQuyenNguoiDung && capDatDuocToiDa(nd) > 0;
}

/**
 * GET — quyền riêng CÒN HIỆU LỰC của chính người gọi (mỗi lần tải trang, `nguoi-dung-hien-tai.tsx`).
 *
 * 📌 Đọc cả hồ sơ người gọi để đối chiếu dấu chức danh → mỗi lượt tải trang tốn 2 lượt đọc (một
 * `getAll`; vai trò toàn cục App Tổng đã cache 30s). Chấp nhận được với vài chục người.
 *
 * `?tatCa=1` → trả thêm bản đồ quyền riêng của MỌI người, chỉ cho người có quyền phân quyền.
 *
 * 🔴 Không đọc được hồ sơ người gọi → 403, KHÔNG trả `quyenRieng: null`. `null` nghĩa là "chưa được
 * tick riêng → theo chức danh"; trình duyệt coi lỗi là KHÔNG cho vào (CLAUDE.md §3.6c).
 */
export async function GET(req: NextRequest) {
  const caller = await verifyClientIdToken(layIdToken(req));
  if (!caller) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const db = getThuMuaDb();
    const [owner, [anhHoSo, anhRieng]] = await Promise.all([
      laOwner(caller.uid),
      db.getAll(refHoSo(caller.uid), refRieng(caller.uid)),
    ]);
    const goi = nguoiGoiTuAnh(caller.uid, owner, anhHoSo, anhRieng);
    if (!goi) {
      return NextResponse.json({ error: "Bạn chưa được cấp quyền ở app Thu mua." }, { status: 403 });
    }
    const riengCuaToi = goi.nguoiDung.quyenRieng ?? null;
    const thamSo = req.nextUrl.searchParams;

    /**
     * ★ `?biKhoa=1` — danh sách MÃ NGHIỆP VỤ của người đang bị bỏ "Vào app" (quyền hiệu lực), cho danh
     * sách "Giao việc cho ai" ở `bang-phan-bo.tsx` lọc họ ra. Sếp 26/09/2026 *"Nối vào ô tíck"*.
     *
     * 📌 Mở cho người có quyền GIAO VIỆC (`phanBoCongViec`) chứ không chỉ người phân quyền — vì ô "Giao
     * việc cho nhân viên" tick được cho người cấp 2, mà họ không đọc được `?tatCa=1`. Trả ĐÚNG một danh
     * sách mã, không trả bản ghi quyền của ai: người giao việc chỉ cần biết "ai không nhận việc được".
     */
    if (thamSo.get("biKhoa") === "1") {
      const qGoi = tinhQuyen(goi.nguoiDung);
      if (!qGoi.phanBoCongViec && !coQuyenPhanQuyen(goi.nguoiDung)) {
        return NextResponse.json({ error: "Bạn không có quyền giao việc." }, { status: 403 });
      }
      const khongVaoApp = (await docTatCaKemHoSo())
        .filter(({ b, hs }) => nguoiBiKhoaVaoApp(hs.nguoiDung, b))
        .map(({ hs }) => hs.nguoiDung.uid);
      return NextResponse.json({ ok: true, quyenRieng: riengCuaToi, khongVaoApp });
    }

    if (thamSo.get("tatCa") !== "1") {
      return NextResponse.json({ ok: true, quyenRieng: riengCuaToi });
    }

    if (!coQuyenPhanQuyen(goi.nguoiDung)) {
      return NextResponse.json({ error: "Bạn không có quyền phân quyền người dùng." }, { status: 403 });
    }

    const tatCa: Record<string, BanGhiQuyenRiengHienThi> = {};
    for (const { uid, b, hs } of await docTatCaKemHoSo()) {
      tatCa[uid] = {
        ...b,
        quyenHieuLuc: quyenRiengConHieuLuc(b, hs.nguoiDung) ?? {},
        lechChucDanh: !khopDauChucDanh(b.theoChucDanh, dauChucDanhCua(hs.nguoiDung)),
      };
    }
    return NextResponse.json({ ok: true, quyenRieng: riengCuaToi, tatCa });
  } catch (e) {
    console.error("[api/quyen-rieng] GET hỏng:", e);
    return NextResponse.json({ error: "Không đọc được quyền riêng." }, { status: 500 });
  }
}

type KetQuaLuu = { ok: true; soDaGhi: number } | { ok: false; error: string; status: number };

/**
 * POST `{ targetUids: string[], quyen: QuyenRieng }` — lưu cho NHIỀU người một lần.
 *
 * 📌 `quyen` là PHẦN THAY ĐỔI: chỉ các cờ người dùng đã chạm. Máy chủ tự ghép với bản đang cất (ĐÃ
 * đối chiếu dấu chức danh) của từng người — không để trình duyệt gửi bản đầy đủ đã có thể cũ.
 *
 * 🔴 TẤT CẢ HOẶC KHÔNG, TRONG MỘT GIAO DỊCH (soát chéo lần 2 26/09/2026): đọc hồ sơ + bản ghi của
 * người gọi và mọi người nhận, kiểm luật, rồi ghi — cả ba trong `runTransaction`. Hai người lưu cùng
 * lúc thì Firestore bắt tranh chấp và chạy lại lượt sau trên dữ liệu mới, không ai đè ai. Hồ sơ đổi
 * giữa chừng (có người vừa đổi chức danh qua `/api/phan-quyen`) cũng làm giao dịch chạy lại.
 */
export async function POST(req: NextRequest) {
  const caller = await verifyClientIdToken(layIdToken(req));
  if (!caller) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { targetUids?: unknown; quyen?: unknown } | null;
  const dsUid = Array.isArray(body?.targetUids) ? (body.targetUids as unknown[]) : null;
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

  const ch = chuanHoaQuyenRieng(body?.quyen);
  if (!ch) {
    return NextResponse.json({ error: "Thiếu quyen." }, { status: 400 });
  }
  /* Khoá lạ = trình duyệt gửi nhầm (hoặc bản giao diện lệch bản máy chủ). TỪ CHỐI chứ không lờ đi:
     lờ đi là người dùng tưởng đã lưu cờ đó. `phanQuyenNguoiDung` và `xuatHoSo` rơi vào đây từ
     26/09/2026 — hai cờ đó không tick được nữa (xem `CO_TICK_DUOC`). */
  if (ch.boQua.length > 0) {
    return NextResponse.json({ error: `Khoá quyền không hợp lệ: ${ch.boQua.join(", ")}.` }, { status: 400 });
  }
  const thayDoi: QuyenRieng = ch.quyen;
  if (Object.keys(thayDoi).length === 0) {
    return NextResponse.json({ error: "Chưa có thay đổi nào để lưu." }, { status: 400 });
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
    const [anhHoSoGoi, anhRiengGoi] = await db.getAll(refHoSo(caller.uid), refRieng(caller.uid));
    const goiTruoc = nguoiGoiTuAnh(caller.uid, ownerGoi, anhHoSoGoi, anhRiengGoi);
    if (!goiTruoc) {
      return NextResponse.json({ error: "Bạn chưa được cấp quyền ở app Thu mua." }, { status: 403 });
    }
    if (!coQuyenPhanQuyen(goiTruoc.nguoiDung)) {
      return NextResponse.json({ error: "Bạn không có quyền phân quyền người dùng." }, { status: 403 });
    }

    /* Vai trò toàn cục App Tổng nằm ở PROJECT KHÁC (`users` của hpcons-portal) nên không vào được
       giao dịch của project Thu mua — đọc trước, ngoài giao dịch (đã cache 30s). */
    const ownerDich = await Promise.all(targetUids.map((u) => laOwner(u)));

    // ---------- ② Đọc + kiểm + ghi trong MỘT giao dịch ----------
    const kq: KetQuaLuu = await db.runTransaction(async (tx) => {
      const n = targetUids.length;
      const anh = await tx.getAll(
        refHoSo(caller.uid),
        refRieng(caller.uid),
        ...targetUids.map(refHoSo),
        ...targetUids.map(refRieng),
      );

      /* Đọc lại người gọi TRONG giao dịch — quyền của họ có thể vừa đổi sau bước ①. */
      const nguoiGoi = nguoiGoiTuAnh(caller.uid, ownerGoi, anh[0], anh[1]);
      if (!nguoiGoi || !coQuyenPhanQuyen(nguoiGoi.nguoiDung)) {
        return { ok: false, error: "Bạn không có quyền phân quyền người dùng.", status: 403 };
      }

      const dich: DichTraoQuyen[] = [];
      const canGhi: { uid: string; quyen: QuyenRieng; nd: NguoiDung }[] = [];
      for (let i = 0; i < n; i++) {
        const u = targetUids[i];
        const hs = nguoiDungTuAnh(u, ownerDich[i], anh[2 + i]);
        if (!hs) {
          return {
            ok: false,
            error: `Có người chưa có hồ sơ ở app Thu mua (mã ${u}) — gán chức danh trước rồi mới tick quyền.`,
            status: 404,
          };
        }
        const goc = tinhQuyenTheoChucDanh(hs.nguoiDung);
        /* 🔴 Bản cũ ĐÃ ĐỐI CHIẾU DẤU — để ngoại lệ "cờ chức danh đã cho sẵn" và phép so trước/sau của
           `vuongMacTraoQuyen` dùng đúng bản hiệu lực, không coi cờ đóng băng từ chức danh cũ là "có sẵn". */
        const riengCu = quyenRiengConHieuLuc(banGhiTuAnh(u, anh[2 + n + i]), hs.nguoiDung);
        const ts = tinhTruocSauKhiLuu(goc, riengCu, hs.nguoiDung.vaiTro === "admin", thayDoi);
        dich.push({
          uid: u,
          ten: hs.nguoiDung.tenHienThi,
          vaiTro: hs.nguoiDung.vaiTro,
          capTM: hs.nguoiDung.capTM,
          quyenGoc: goc,
          quyenTruoc: ts.quyenTruoc,
          quyenSau: ts.quyenSau,
          boVaoApp: ts.boVaoApp,
        });
        /* Cùng phép tính màn hình dùng để quyết định gửi ai — lượt ghi vô nghĩa thì bỏ, và người chưa
           có quyền riêng mà kết quả y hệt mẫu chức danh thì giữ "theo chức danh". */
        if (ts.canGhi) canGhi.push({ uid: u, quyen: ts.riengMoi, nd: hs.nguoiDung });
      }

      const chan = vuongMacTraoQuyen(nguoiGoi, dich);
      if (chan) return { ok: false, error: chan, status: 403 };

      const luc = new Date().toISOString();
      for (const g of canGhi) {
        const banGhi: BanGhiQuyenRieng = {
          quyen: g.quyen,
          /* Dấu lấy từ hồ sơ VỪA ĐỌC TRONG GIAO DỊCH, không nhận từ trình duyệt. */
          theoChucDanh: dauChucDanhCua(g.nd),
          capNhatLuc: luc,
          capNhatBoi: caller.uid,
          capNhatBoiTen: nguoiGoi.nguoiDung.tenHienThi,
        };
        tx.set(refRieng(g.uid), banGhi);
      }
      return { ok: true, soDaGhi: canGhi.length };
    });

    if (!kq.ok) {
      return NextResponse.json({ error: kq.error }, { status: kq.status });
    }
    return NextResponse.json({
      ok: true,
      soDaGhi: kq.soDaGhi,
      soGiuNguyen: targetUids.length - kq.soDaGhi,
    });
  } catch (e) {
    console.error("[api/quyen-rieng] POST hỏng:", e);
    return NextResponse.json({ error: "Không lưu được quyền riêng. Thử lại sau." }, { status: 500 });
  }
}
