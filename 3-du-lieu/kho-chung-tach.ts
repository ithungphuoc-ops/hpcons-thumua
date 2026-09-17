// ============================================================
// KHO DỮ LIỆU CHUNG — BẢN TÁCH: MỖI CHỨNG TỪ MỘT TÀI LIỆU
//
// 🔴 THAY CHO `kho-chung-firestore.ts` (một tài liệu chứa tất cả). Sếp duyệt kế hoạch 16/09/2026.
//
// Chính chú thích của tệp cũ đã ghi sẵn từ 12/08/2026:
//   *"lên bản thật phải tách từng chứng từ ra document riêng để hai người sửa hai hồ sơ khác nhau
//    không đụng nhau"*
//
// Đó là việc tệp này làm. Hai hậu quả đã ĐO ĐƯỢC của mô hình cũ:
//   · 15/09 — ba đơn hàng BIẾN MẤT. Máy giữ ảnh chụp cũ ghi đè lên đơn người khác vừa lập.
//     Không ai xoá, không có nút nào xoá đơn. Chúng bị đè.
//   · 15/09 — vòng lặp ghi vô tận: 12 lần ghi trong 120 giây khi không ai thao tác. Mỗi lần ghi
//     phát tán ~150 KB cho mọi máy đang mở, mỗi máy nhận xong lại ghi tiếp.
//
// ════════════════════════════════════════════════════════════════════════════════════════
// 🔴🔴 LÝ DO THỨ HAI, QUAN TRỌNG HƠN CẢ CHUYỆN ĐÈ NHAU — PHÂN QUYỀN THEO GIÁ
// ════════════════════════════════════════════════════════════════════════════════════════
// `5-ket-noi/firestore.rules` (thiết kế có sẵn trong repo, đọc được ngày 16/09/2026) nêu:
//
//   *"Security Rules chặn được cả DOCUMENT, KHÔNG chặn được từng TRƯỜNG. Nên mọi thứ dính tiền
//    phải nằm ở document riêng."*
//
//     `tm_donhang`     — KHÔNG có giá → thủ kho, ban chỉ huy ĐỌC ĐƯỢC
//     `tm_donhang_gia` — CÓ giá       → hai nhóm đó KHÔNG đọc được
//
// Sếp xác nhận 16/09/2026: *"kho thì không cần biết giá"*.
//
// ⚠️ ẨN CỘT GIÁ TRÊN GIAO DIỆN KHÔNG PHẢI BẢO MẬT — mở công cụ lập trình ra vẫn thấy. Gộp giá
// ngược vào `tm_donhang` là xoá luôn đường phân quyền này, và không ai nhận ra cho tới lúc có
// người bên kho đọc được đơn giá nhà cung cấp.
//
// ════════════════════════════════════════════════════════════════════════════════════════
// 📌 BA QUYẾT ĐỊNH CỦA SẾP NGÀY 16/09/2026 — ĐỌC TRƯỚC KHI ĐỔI CẤU TRÚC
// ════════════════════════════════════════════════════════════════════════════════════════
// ① TÊN COLLECTION lấy ĐÚNG theo `firestore.rules` đã thiết kế sẵn, không tự đặt tên mới.
//
// ② CHƯA lồng dưới `projects/{mã}` như rules mô tả. Đo trên dữ liệu thật 16/09: hồ sơ PHÒNG BAN
//    không thuộc dự án nào — `maDuAn` của nó đang mang chính *tên phòng ban*
//    ("Phòng Kỹ thuật Thi công (HP Cons)"). Lồng bây giờ là tạo ra những "dự án" tên phòng ban,
//    đặt sai chỗ ngay từ đầu; và đơn hàng độc lập cũng chưa gắn dự án nào.
//    📌 Mỗi tài liệu VẪN GIỮ trường `maDuAn`. Khi App Tổng chốt được mã dự án ổn định và xử lý
//    xong ca phòng ban, chuyển sang lồng chỉ là chép lại một lần — dữ liệu đã sẵn trường cần.
//    📌 Chặn theo dự án lúc này vẫn làm được bằng điều kiện trong rules, không nhất thiết phải lồng.
//
// ③ PHIẾU NHẬN LỒNG TRONG ĐƠN HÀNG (`tm_donhang/{poId}/nhanhang/{id}`), đúng thiết kế: phiếu nhận
//    luôn thuộc đúng một đơn, xoá đơn thì phiếu đi theo chứ không thành mồ côi. Kèm theo đó,
//    rules cho phép thủ kho GHI phiếu còn Thu mua chỉ ĐỌC — kho là nguồn duy nhất của số thực nhận.
//
// ⚠️ TỆP NÀY CHƯA ĐƯỢC BẬT. Bước 1 của kế hoạch là viết xong và kiểm, chưa đổi đường chạy. Đổi
// sang dùng nó là bước 3, sau khi đã chuyển dữ liệu (bước 2) và đối chiếu số lượng.
// ============================================================

import type { DuLieuLuu } from "@/3-du-lieu/luu-tren-may";
import { tinhViecGhi, type ViecGhi } from "@/2-quy-trinh/so-sanh-kho-tach";
import { daCauHinhFirebase, moFirebase } from "@/5-ket-noi/firebase-chung";

/**
 * ★ TÊN COLLECTION — dời sang `3-du-lieu/duong-dan-tach.ts` ngày 17/09/2026.
 *
 * 🔴 VÌ SAO DỜI ĐI: ba route máy chủ chạy bằng Admin SDK cũng cần đúng bộ tên này. Tệp hiện tại
 * `import` SDK Firebase **bản trình duyệt**, nên để chúng import từ đây là kéo cả SDK trình duyệt
 * vào bundle máy chủ chỉ để lấy mấy chuỗi hằng. Tệp mới không import gì cả nên cả hai phía dùng
 * chung được.
 *
 * 📌 Re-export để mọi nơi đang `import { DUONG_DAN_TACH } from "@/3-du-lieu/kho-chung-tach"` vẫn
 * chạy y nguyên — một nguồn tên duy nhất, không bên nào chép lại lần hai.
 */
import { DUONG_DAN_TACH } from "@/3-du-lieu/duong-dan-tach";
export { DUONG_DAN_TACH };

/**
 * Năm nhóm cất PHẲNG — mỗi nhóm một collection gốc.
 *
 * ⚠️ `phieuNhan` KHÔNG nằm trong đây: nó lồng trong đơn hàng (quyết định ③ của Sếp), nên phải xử
 * lý riêng cả lúc nghe lẫn lúc ghi — đường dẫn của nó cần CẢ `poId` lẫn `id`.
 */
const NHOM_PHANG = ["deNghi", "donHang", "giaDonHang", "baoGia", "thongBao"] as const;
type NhomPhang = (typeof NHOM_PHANG)[number];

/**
 * Cách lấy khoá duy nhất của từng nhóm.
 *
 * 🔴 `giaDonHang` DÙNG `poId`, KHÔNG PHẢI `id` — kiểu `GiaDonDatHang` không hề có trường `id`
 * (đo trên `kieu-du-lieu.ts` ngày 16/09/2026). Dùng nhầm `id` thì mọi bản giá đều có khoá rỗng,
 * bị hàm so sánh bỏ qua, và **bảng giá không bao giờ lên được máy chủ** — hỏng im lặng.
 */
const LAY_KHOA: Record<NhomPhang, (x: unknown) => string> = {
  deNghi: (x) => String((x as { id?: unknown }).id ?? ""),
  donHang: (x) => String((x as { id?: unknown }).id ?? ""),
  giaDonHang: (x) => String((x as { poId?: unknown }).poId ?? ""),
  baoGia: (x) => String((x as { id?: unknown }).id ?? ""),
  thongBao: (x) => String((x as { id?: unknown }).id ?? ""),
};

/** Phiếu nhận cần HAI khoá: `id` là tên tài liệu, `poId` là đơn hàng chứa nó. */
const layIdPhieu = (x: unknown) => String((x as { id?: unknown }).id ?? "");
const layPoIdPhieu = (x: unknown) => String((x as { poId?: unknown }).poId ?? "");

export const daCauHinhFirestore = daCauHinhFirebase;

export interface KetNoiKhoChungTach {
  dong: () => void;
  /**
   * Đẩy trạng thái hiện tại lên, CHỈ ghi phần đã đổi.
   *
   * @returns `null` nếu ghi xong; câu lý do nếu **từ chối ghi** (xem cờ báo động ở
   *   `so-sanh-kho-tach.ts`). Nơi gọi phải xử lý chuỗi trả về, đừng bỏ qua — nó là lưới chắn
   *   cuối trước khi xoá nhầm dữ liệu của cả phòng.
   */
  day: (d: DuLieuLuu) => Promise<string | null>;
}

async function moKetNoi() {
  const app = await moFirebase();
  if (!app) return null;
  const { getFirestore, collection, collectionGroup, doc, onSnapshot, writeBatch } = await import(
    "firebase/firestore"
  );
  return { app, db: getFirestore(app), collection, collectionGroup, doc, onSnapshot, writeBatch };
}

/**
 * Nối kho chung bản tách.
 *
 * `khiCoDuLieu` chỉ được gọi khi đã nghe được **đủ cả bảy nhóm** ít nhất một lần — xem
 * `daNgheDu` bên dưới.
 */
export async function noiKhoChungTach(
  khiCoDuLieu: (d: DuLieuLuu) => void,
  khiLoi?: (e: unknown) => void,
): Promise<KetNoiKhoChungTach | null> {
  if (typeof window === "undefined" || !daCauHinhFirestore()) return null;

  try {
    const kn = await moKetNoi();
    if (!kn) return null;
    const { db, collection, collectionGroup, doc, onSnapshot, writeBatch } = kn;

    /** Bộ dữ liệu ghép từ bảy nhóm. Bắt đầu rỗng, từng nhóm đổ vào khi nghe được. */
    const gop: DuLieuLuu = {
      deNghi: [],
      donHang: [],
      giaDonHang: [],
      phieuNhan: [],
      baoGia: [],
      thongBao: [],
    };

    /**
     * ★★★ CHỐT NGUY HIỂM NHẤT CỦA CẢ TỆP NÀY — ĐỪNG BAO GIỜ BỎ.
     *
     * 🔴 Bảy nhóm nghe độc lập, và chúng về KHÔNG CÙNG LÚC. Nếu gọi `khiCoDuLieu` ngay khi nhóm
     * đầu tiên về, bộ dữ liệu lúc đó có đề nghị nhưng **đơn hàng rỗng** — và tầng trên sẽ tưởng
     * cả phòng không có đơn nào. Chỉ cần nó ghi ngược lên một cái là **xoá sạch đơn hàng thật**.
     *
     * Đây đúng là hình dạng của sự cố mất ba đơn ngày 15/09, chỉ khác nguyên nhân. Mô hình tách
     * sửa được chuyện hai máy đè nhau, nhưng lại mở ra đúng cái bẫy này nếu làm ẩu.
     *
     * ✅ Chỉ gọi `khiCoDuLieu` khi đã nghe đủ CẢ BẢY nhóm ít nhất một lần. Từ lần thứ hai trở đi
     * thì nhóm nào đổi cũng gọi được, vì sáu nhóm kia đã có dữ liệu thật.
     */
    const daNghe = new Set<string>();
    const TONG_NGUON = NHOM_PHANG.length + 2; // 5 nhóm phẳng + phiếu nhận + cài đặt

    const bao = () => {
      if (daNghe.size < TONG_NGUON) return;
      /* Chép nông trước khi đưa ra ngoài: tầng trên giữ tham chiếu này làm state, mà `gop` còn bị
         các lần nghe sau sửa tiếp. Đưa thẳng là state và nguồn dùng chung một object. */
      khiCoDuLieu({ ...gop });
    };

    const huy: Array<() => void> = [];

    for (const nhom of NHOM_PHANG) {
      huy.push(
        onSnapshot(
          collection(db, DUONG_DAN_TACH[nhom]),
          (anh) => {
            (gop[nhom] as unknown[]) = anh.docs.map((d) => d.data());
            daNghe.add(nhom);
            bao();
          },
          (e) => {
            /* Nghe hỏng một nhóm thì KHÔNG đánh dấu đã nghe — thà chờ mãi còn hơn báo lên một bộ
               dữ liệu thiếu nhóm đó. Xem chốt `daNgheDu`. */
            khiLoi?.(e);
          },
        ),
      );
    }

    /**
     * ★ PHIẾU NHẬN — nghe bằng `collectionGroup` vì nó lồng trong TỪNG đơn hàng.
     *
     * 🔴 KHÔNG nghe từng đơn một: số đơn đổi liên tục, mỗi lần thêm đơn lại phải gắn thêm một lượt
     * nghe rồi gỡ đi khi đơn mất — vừa rối vừa dễ rò rỉ lượt nghe. `collectionGroup` nghe một lần
     * cho mọi đơn, kể cả đơn lập sau.
     *
     * ⚠️ `collectionGroup` cần một index, Firestore tự đề nghị lúc chạy lần đầu. Chưa có index thì
     * lượt nghe này hỏng, và theo chốt `TONG_NGUON` ở trên thì app sẽ **chờ mãi không hiện dữ
     * liệu**. Nhớ kiểm ngay lần đầu bật, đừng để người dùng gặp trước.
     */
    huy.push(
      onSnapshot(
        collectionGroup(db, DUONG_DAN_TACH.phieuNhanTrongDon),
        (anh) => {
          gop.phieuNhan = anh.docs.map((d) => d.data()) as DuLieuLuu["phieuNhan"];
          daNghe.add("phieuNhan");
          bao();
        },
        (e) => khiLoi?.(e),
      ),
    );

    huy.push(
      onSnapshot(
        doc(db, DUONG_DAN_TACH.caiDat, DUONG_DAN_TACH.tepCaiDat),
        (anh) => {
          const d = (anh.data() ?? {}) as Partial<DuLieuLuu>;
          /* Giữ nguyên dạng "không có khoá" khi chưa có, KHÔNG thay bằng bản mặc định — tầng trên
             phân biệt "chưa có" với "có nhưng để mặc định" để quyết định đẩy lên hay lấy về. Đúng
             luật đã ghi ở `chuanHoa` của tệp cũ, chỗ từng dính lỗi thật với `cauHinh`. */
          if (d.cauHinh) gop.cauHinh = d.cauHinh;
          else delete gop.cauHinh;
          if (Array.isArray(d.lichSuCauHinh)) gop.lichSuCauHinh = d.lichSuCauHinh;
          else delete gop.lichSuCauHinh;
          if (Array.isArray(d.nhaCungCapThem)) gop.nhaCungCapThem = d.nhaCungCapThem;
          else delete gop.nhaCungCapThem;
          if (Array.isArray(d.thuKhoThem)) gop.thuKhoThem = d.thuKhoThem;
          else delete gop.thuKhoThem;
          daNghe.add("caiDat");
          bao();
        },
        (e) => khiLoi?.(e),
      ),
    );

    /**
     * Ảnh chụp lần đẩy gần nhất — nền để biết lần sau cái gì đã đổi.
     *
     * 🔴 CHỈ CẬP NHẬT SAU KHI GHI THÀNH CÔNG. Cập nhật trước mà ghi hỏng thì lần sau app tưởng đã
     * đồng bộ rồi và **không bao giờ ghi lại** — mất dữ liệu im lặng. Đúng bài học của
     * `anhChupCuoi` trong `kho-du-lieu.tsx`, đã dính thật ngày 15/09/2026.
     */
    let anhChup: DuLieuLuu | null = null;

    return {
      dong: () => {
        for (const h of huy) h();
      },

      day: async (d) => {
        const batch = writeBatch(db);
        let soViec = 0;
        const canhBao: string[] = [];

        for (const nhom of NHOM_PHANG) {
          /* Giữ nguyên kiểu union của từng nhóm, không ép về một kiểu chung: `LAY_KHOA` nhận
             `unknown` nên khớp được với mọi nhóm mà không phải bẻ kiểu ở đây. */
          const truoc = anhChup?.[nhom] ?? [];
          const sau = d[nhom] ?? [];
          const viec: ViecGhi<unknown> = tinhViecGhi(truoc, sau, LAY_KHOA[nhom]);

          /* 🔴 LƯỚI CHẮN — xem `NGUONG_XOA_DANG_NGO` ở `so-sanh-kho-tach.ts`. Bỏ CẢ LƯỢT ghi, chứ
             không phải chỉ bỏ phần xoá: một bộ dữ liệu bất thường tới mức xoá quá nửa kho thì
             phần "sửa" của nó cũng không đáng tin. */
          if (viec.dangNgo) {
            canhBao.push(
              `${nhom}: bỏ ${viec.xoa.length}/${truoc.length} bản ghi trong một lượt`,
            );
            continue;
          }

          const ten = DUONG_DAN_TACH[nhom];
          for (const v of viec.datLai) {
            /* `as` ở đây là bắt buộc: `v.ban` mang kiểu nghiệp vụ (DeNghiMuaHang, DonDatHang…),
               còn `batch.set` đòi `DocumentData`. Hai kiểu không chồng lấn theo TypeScript dù
               thực tế chúng là cùng một object thuần. */
            batch.set(doc(db, ten, v.khoa), v.ban as Record<string, unknown>);
            soViec += 1;
          }
          for (const k of viec.xoa) {
            batch.delete(doc(db, ten, k));
            soViec += 1;
          }
        }

        /* ══ PHIẾU NHẬN — lồng trong đơn nên đường dẫn cần CẢ `poId` lẫn `id` ══ */
        const phieuTruoc = anhChup?.phieuNhan ?? [];
        const phieuSau = d.phieuNhan ?? [];
        const viecPhieu: ViecGhi<unknown> = tinhViecGhi(phieuTruoc, phieuSau, layIdPhieu);
        if (viecPhieu.dangNgo) {
          canhBao.push(
            `phieuNhan: bỏ ${viecPhieu.xoa.length}/${phieuTruoc.length} bản ghi trong một lượt`,
          );
        } else {
          for (const v of viecPhieu.datLai) {
            const poId = layPoIdPhieu(v.ban);
            /* 🔴 Phiếu không biết thuộc đơn nào thì KHÔNG ghi. Ghi vào một đơn đoán bừa còn tệ hơn
               không ghi: sau đó nó nằm sai chỗ mà vẫn trông như đã lưu, và số nhận của đơn kia sai
               theo — mà số nhận là thứ quyết định đơn đã đủ hàng hay chưa. */
            if (!poId) continue;
            batch.set(
              doc(db, DUONG_DAN_TACH.donHang, poId, DUONG_DAN_TACH.phieuNhanTrongDon, v.khoa),
              v.ban as Record<string, unknown>,
            );
            soViec += 1;
          }
          for (const k of viecPhieu.xoa) {
            /* Tra `poId` từ ẢNH CHỤP TRƯỚC: phiếu đã biến mất khỏi state hiện tại, chỉ bản cũ còn
               biết nó từng thuộc đơn nào. Không có bản cũ thì bỏ qua — thà để lại một phiếu thừa
               còn hơn xoá nhầm phiếu của đơn khác. */
            const cu = phieuTruoc.find((x) => layIdPhieu(x) === k);
            const poId = cu ? layPoIdPhieu(cu) : "";
            if (!poId) continue;
            batch.delete(
              doc(db, DUONG_DAN_TACH.donHang, poId, DUONG_DAN_TACH.phieuNhanTrongDon, k),
            );
            soViec += 1;
          }
        }

        if (canhBao.length > 0) {
          /* KHÔNG ghi gì cả và nói thẳng lý do. Nơi gọi phải bày ra cho người dùng — im lặng bỏ
             qua là họ làm việc trong ảo tưởng đã lưu (CLAUDE.md §3.5). */
          return (
            "Từ chối ghi vì dữ liệu trông bất thường — " +
            canhBao.join("; ") +
            ". Tải lại trang rồi thử lại; nếu còn báo thế này thì báo bộ phận phụ trách."
          );
        }

        /* Cài đặt luôn ghi đè cả tài liệu: nó chỉ có một bản, không có gì để so từng phần. */
        const caiDat: Record<string, unknown> = {};
        if (d.cauHinh) caiDat.cauHinh = d.cauHinh;
        if (d.lichSuCauHinh) caiDat.lichSuCauHinh = d.lichSuCauHinh;
        if (d.nhaCungCapThem) caiDat.nhaCungCapThem = d.nhaCungCapThem;
        if (d.thuKhoThem) caiDat.thuKhoThem = d.thuKhoThem;
        const chuoiCaiDatMoi = JSON.stringify(caiDat);
        const chuoiCaiDatCu = anhChup
          ? JSON.stringify({
              ...(anhChup.cauHinh ? { cauHinh: anhChup.cauHinh } : {}),
              ...(anhChup.lichSuCauHinh ? { lichSuCauHinh: anhChup.lichSuCauHinh } : {}),
              ...(anhChup.nhaCungCapThem ? { nhaCungCapThem: anhChup.nhaCungCapThem } : {}),
              ...(anhChup.thuKhoThem ? { thuKhoThem: anhChup.thuKhoThem } : {}),
            })
          : "";
        if (chuoiCaiDatMoi !== chuoiCaiDatCu) {
          batch.set(doc(db, DUONG_DAN_TACH.caiDat, DUONG_DAN_TACH.tepCaiDat), caiDat);
          soViec += 1;
        }

        /* Không có gì đổi thì đừng chạm vào máy chủ. Đây chính là chỗ mô hình tách ăn đứt mô hình
           cũ: bản cũ ghi đè cả khối mỗi lần, dù không có gì đổi. */
        if (soViec === 0) return null;

        await batch.commit();
        anhChup = { ...d };
        return null;
      },
    };
  } catch (e) {
    khiLoi?.(e);
    return null;
  }
}
