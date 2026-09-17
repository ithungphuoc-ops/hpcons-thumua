// ============================================================
// NĂNG LỰC PHÒNG THU MUA — CỘNG THEO NHÂN VIÊN QUA NHIỀU ĐỀ NGHỊ
//
// ★★ Sếp 17/09/2026: việc nhân bản đề nghị là *"tài liệu để đánh giá KPI của từng nhân viên,
// của phòng ban"*. App trước đó chỉ có `bang-nang-luc-theo-nhan-vien.tsx` — thống kê trong
// ĐÚNG MỘT nhóm đề xuất, mở từ trang chi tiết một phiếu. Không có chỗ nào cộng qua nhiều đề nghị.
//
// 🔴🔴 ĐIỀU PHẢI ĐỌC TRƯỚC KHI DÙNG CON SỐ Ở ĐÂY — đã báo Sếp ngày 17/09/2026 và Sếp vẫn chốt làm:
// **App KHÔNG có thước đo độ khó.** Không biết vật tư nào hiếm, nhà cung cấp nào hay chậm, phần
// việc nào nặng. Nên hai người cùng 10 dòng vật tư có thể đã bỏ ra công sức rất khác nhau.
// `bang-nang-luc-theo-nhan-vien.tsx` (khối cũ) tự ghi nó *"không phải bảng xếp hạng"* đúng vì lý
// do này, và lý do đó **vẫn còn nguyên giá trị** — cộng qua nhiều kỳ không làm nó biến mất, chỉ
// làm con số trông đáng tin hơn thực tế.
// 👉 Dùng để biết **ai đang giữ phần nào, chỗ nào đang tắc**. Đừng dùng một mình để kết luận năng lực.
//
// 🔴 HAI LỖI CỦA KHỐI CŨ ĐÃ ĐO ĐƯỢC VÀ KHÔNG BÊ SANG ĐÂY:
//   ① Khối cũ duyệt `dn.items` **không lọc**, nên dòng đã nhân bản đi vẫn còn trên phiếu gốc kèm
//      tên người cũ, mà bản con cũng có dòng đó ⇒ **một việc thật đếm thành hai**.
//   ② Khối cũ dùng `giaiDoanDaKetThuc` để đếm "Xong", mà hàm đó gồm **cả `that_bai`** (đóng dở,
//      không mua nữa) ⇒ bảng đánh giá **thưởng công cho việc thất bại**.
//
// 👉 HÀM THUẦN, không đụng React — để `kiem-luat-dung-chung.mjs` gọi thật được.
// ============================================================

import type { DeNghiMuaHang, DonDatHang, PhieuNhanHang } from "@/3-du-lieu/kieu-du-lieu";
import type { BaoGia } from "@/3-du-lieu/kieu-du-lieu";
import { locTienDoConPhaiMua } from "@/2-quy-trinh/nhan-ban-de-nghi";
import { hanXuLyDeNghi, xacDinhGiaiDoan } from "@/2-quy-trinh/giai-doan-mua-hang";

/** Một dòng của bảng năng lực — tất cả đều là số đếm được, không có số suy diễn. */
export interface DongNangLucNhanVien {
  uid: string;
  ten: string;
  /** Số dòng vật tư đang phụ trách, ĐÃ trừ dòng đã nhân bản đi. */
  soDong: number;
  /** Số phiếu có ít nhất một dòng của người này. */
  soPhieu: number;
  /** Phiếu đã hoàn thành — KHÔNG gồm phiếu đóng dở. */
  soPhieuXong: number;
  /** Phiếu đóng dở (`that_bai`) — tách hẳn, không cộng vào "xong". */
  soPhieuDongDo: number;
  /** Phiếu CHƯA kết thúc mà đã quá hạn xử lý. */
  soPhieuQuaHan: number;
}

/**
 * Cộng năng lực theo từng nhân viên trên MỘT danh sách đề nghị đã lọc theo kỳ.
 *
 * 🔴 LỌC KỲ Ở NƠI GỌI, KHÔNG LỌC Ở ĐÂY. Hàm này không biết "kỳ" là gì — truyền vào danh sách nào
 * thì cộng đúng danh sách đó. Nhét phép lọc ngày vào đây là sớm muộn có hai định nghĩa "tháng 9"
 * ở hai chỗ.
 *
 * ⚠️ `tatCaDeNghi` là danh sách **ĐẦY ĐỦ** (chưa lọc kỳ) — cần cho `locTienDoConPhaiMua` và
 * `xacDinhGiaiDoan` tra các bản con. Truyền danh sách đã lọc là bản con rơi ra ngoài kỳ thì dòng
 * đã giao đi lại được tính ngược về phiếu gốc.
 */
export function congNangLucTheoNhanVien(
  deNghiTrongKy: DeNghiMuaHang[],
  tatCaDeNghi: DeNghiMuaHang[],
  tatCaPO: DonDatHang[],
  tatCaBaoGia: BaoGia[],
  tatCaPhieu: PhieuNhanHang[],
): DongNangLucNhanVien[] {
  const theoNguoi = new Map<
    string,
    { ten: string; soDong: number; phieu: Set<string>; xong: Set<string>; dongDo: Set<string>; quaHan: Set<string> }
  >();

  for (const dn of deNghiTrongKy) {
    const giaiDoan = xacDinhGiaiDoan(dn, tatCaPO, tatCaBaoGia, tatCaPhieu, tatCaDeNghi);
    /**
     * 🔴 CHỈ `hoan_thanh` MỚI LÀ "XONG" — cố ý KHÔNG dùng `giaiDoanDaKetThuc`, vì hàm đó gồm cả
     * `that_bai`. Phiếu đóng dở là **kết luận không mua nữa**, đếm chung với phiếu hoàn thành là
     * bảng đánh giá thưởng công cho việc thất bại. Đây là lỗi của khối cũ, không mang sang.
     */
    const xong = giaiDoan === "hoan_thanh";
    const dongDo = giaiDoan === "that_bai";
    const quaHan = !xong && !dongDo && hanXuLyDeNghi(dn, giaiDoan).quaHan;

    /**
     * 🔴 TRỪ DÒNG ĐÃ NHÂN BẢN ĐI — đây là cột chống đếm hai lần. Phiếu gốc **giữ nguyên** dòng đã
     * giao đi (chỉ làm mờ, Sếp chốt 15/09), và bản con cũng có dòng đó; không lọc là một việc thật
     * đếm thành hai, đúng lỗi khối cũ đang mắc.
     */
    const conPhaiLam = locTienDoConPhaiMua(
      dn,
      tatCaDeNghi,
      dn.items.map((d) => ({ stt: d.stt, uid: d.nguoiPhuTrachUid, ten: d.nguoiPhuTrachTen })),
    );

    for (const d of conPhaiLam) {
      if (!d.uid) continue;
      const c = theoNguoi.get(d.uid) ?? {
        ten: d.ten ?? d.uid,
        soDong: 0,
        phieu: new Set<string>(),
        xong: new Set<string>(),
        dongDo: new Set<string>(),
        quaHan: new Set<string>(),
      };
      c.soDong += 1;
      c.phieu.add(dn.id);
      if (xong) c.xong.add(dn.id);
      if (dongDo) c.dongDo.add(dn.id);
      if (quaHan) c.quaHan.add(dn.id);
      /* Tên lấy theo lần gặp gần nhất — người đổi tên hiển thị thì bảng theo tên mới, còn khoá gom
         vẫn là uid nên số liệu không tách làm hai. */
      c.ten = d.ten ?? c.ten;
      theoNguoi.set(d.uid, c);
    }
  }

  return [...theoNguoi.entries()]
    .map(([uid, c]) => ({
      uid,
      ten: c.ten,
      soDong: c.soDong,
      soPhieu: c.phieu.size,
      soPhieuXong: c.xong.size,
      soPhieuDongDo: c.dongDo.size,
      soPhieuQuaHan: c.quaHan.size,
    }))
    /* Nhiều dòng vật tư nhất lên đầu — đó là người đang gánh nhiều nhất, thứ người quản lý cần
       thấy trước. Cùng số dòng thì xếp theo tên cho thứ tự ổn định giữa các lần mở. */
    .sort((a, b) => b.soDong - a.soDong || a.ten.localeCompare(b.ten, "vi"));
}

/** Cộng dồn cả phòng. Trả `null` khi chưa có ai để cộng — nơi gọi khỏi phải tự xét mảng rỗng. */
export function congCaPhong(ds: DongNangLucNhanVien[]): Omit<DongNangLucNhanVien, "uid" | "ten"> | null {
  if (ds.length === 0) return null;
  return {
    soDong: ds.reduce((s, x) => s + x.soDong, 0),
    /**
     * ⚠️ CỘNG THẲNG, KHÔNG KHỬ TRÙNG PHIẾU — và phải nói rõ vì nó dễ bị hiểu nhầm. Một phiếu có
     * hai người phụ trách thì được tính cho **cả hai**, nên tổng ở đây là *"tổng lượt người-phiếu"*,
     * không phải *"số phiếu của phòng"*. Đó đúng là thứ cần cho bảng năng lực; ai muốn đếm phiếu
     * thì đếm trên danh sách đề nghị, đừng đọc con số này.
     */
    soPhieu: ds.reduce((s, x) => s + x.soPhieu, 0),
    soPhieuXong: ds.reduce((s, x) => s + x.soPhieuXong, 0),
    soPhieuDongDo: ds.reduce((s, x) => s + x.soPhieuDongDo, 0),
    soPhieuQuaHan: ds.reduce((s, x) => s + x.soPhieuQuaHan, 0),
  };
}
