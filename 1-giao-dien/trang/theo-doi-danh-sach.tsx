"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Clock, Eye, GitBranch, UserCheck } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { TimelineDeNghi } from "@/1-giao-dien/thanh-phan-nghiep-vu/timeline-de-nghi";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { boDau } from "@/6-tien-ich/bo-dau";
import { nhanPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";
import { tinhTienDoDeNghi, tomTatTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import { nhanAnToan, NHAN_TRANG_THAI_DE_NGHI } from "@/2-quy-trinh/trang-thai";
import { NHAN_GIAI_DOAN, xacDinhGiaiDoan } from "@/2-quy-trinh/giai-doan-mua-hang";
import { laViecCuaToi, soSanhDeNghiUuTien } from "@/2-quy-trinh/sap-xep-uu-tien";
import { laNguoiTheoDoi } from "@/4-phan-quyen/quyen-theo-ho-so";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * ★ KHÓA GOM NHÓM THEO CÔNG TRÌNH — MỘT HÀM DUY NHẤT (22/08/2026).
 *
 * 🔴 PHẢI DÙNG CHUNG cho cả chỗ GOM (`dongHienThi`) và chỗ QUYẾT ĐỊNH HIỆN THẺ (`hienThe`).
 * Lần đầu tôi viết hai bản giống nhau ở hai chỗ, và chúng đã lệch nhau ngay: một bên dùng ký tự
 * NUL làm tiền tố nhóm "chưa ghi công trình", bên kia dùng khoảng trắng — nên nhóm đó bấm mở mà
 * không thẻ nào hiện, và **không có lỗi nào báo ra**. Đây đúng kiểu lỗi mà quy ước dự án gọi là
 * "hai chỗ cùng tính một thứ rồi lệch nhau".
 *
 * 📌 Chuẩn hóa bỏ dấu + gộp khoảng trắng + không phân biệt hoa thường: cùng một công trình mà
 * người này gõ *"Công trình AID"*, người kia *"cong trinh aid"* thì vẫn về một nhóm.
 */
const NHOM_CHUA_GHI_CONG_TRINH = "__chua-ghi-cong-trinh__";

/**
 * ★ CHỌN GOM NHÓM THEO CÔNG TRÌNH HAY PHÒNG BAN — Ban lãnh đạo 23/08/2026: *"thêm chức năng
 * group theo tên công trình / Tên phòng ban"*.
 *
 * 📌 Hai cách nhìn cho hai câu hỏi khác nhau, nên phải là LỰA CHỌN chứ không phải đổi mặc định:
 *   · theo công trình → *"công trình này còn hồ sơ nào chưa xong"*
 *   · theo phòng ban  → *"phòng nào đang gửi nhiều đề nghị nhất, hồ sơ của phòng tôi tới đâu"*
 */
export type CachGomNhom = "cong_trinh" | "phong_ban";

/**
 * ★ KHÓA GOM NHÓM — MỘT HÀM DUY NHẤT CHO CẢ HAI CÁCH.
 *
 * 🔴 PHẢI DÙNG CHUNG cho chỗ GOM (`dongHienThi`) và chỗ QUYẾT ĐỊNH HIỆN THẺ (`hienThe`) — lý do
 * ghi ở khối chú thích trên. Thêm cách gom thứ hai thì càng phải giữ một hàm: hai bản chép tay
 * mà lệch nhau là nhóm bấm mở nhưng không thẻ nào hiện, **không có lỗi nào báo ra**.
 *
 * 📌 Phòng ban dùng thẳng mã (`phongBanNguon`) làm khóa — mã là giá trị đã chuẩn của app, không
 * cần bỏ dấu hay gộp khoảng trắng như tên công trình người dùng gõ tay.
 */
function khoaNhom(dn: DeNghiMuaHang, cach: CachGomNhom): string {
  if (cach === "phong_ban") return dn.phongBanNguon || NHOM_CHUA_GHI_CONG_TRINH;
  const ten = (dn.tenCongTrinh ?? "").trim();
  if (ten === "") return NHOM_CHUA_GHI_CONG_TRINH;
  return boDau(ten).replace(/\s+/g, " ").trim().toLowerCase();
}

/** Tên hiện trên dòng tiêu đề nhóm — lấy đúng cách người dùng đã gõ / nhãn phòng ban chuẩn. */
function tenNhomHienThi(dn: DeNghiMuaHang, cach: CachGomNhom): string {
  if (cach === "phong_ban") {
    return dn.phongBanNguon ? nhanPhongBan(dn.phongBanNguon) : "Chưa ghi phòng ban";
  }
  const ten = (dn.tenCongTrinh ?? "").trim();
  return ten === "" ? "Chưa ghi công trình" : ten;
}

const NHAN_CACH_NHOM: Record<CachGomNhom, string> = {
  cong_trinh: "Công trình",
  phong_ban: "Phòng ban",
};

/**
 * M6 — Người đề nghị (Phòng Thi công) theo dõi tiến trình đề nghị của mình.
 * Màn hình MỚI, bản thumua-next cũ không có.
 * 🔒 Không hiển thị: đơn giá, thành tiền, nhà cung cấp, tên nhân viên thu mua.
 */
export default function TrangTheoDoi() {
  const { deNghi, donHang, baoGia, phieuNhan } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  /**
   * Vai trò quản lý thấy hết; còn lại chỉ thấy hồ sơ mình có dính vào.
   *
   * 🔴 SỬA 15/08/2026 — TRƯỚC ĐÂY MÀN HÌNH NÓI SAI VỀ CHÍNH NÓ. Bộ lọc chỉ kiểm
   * `nguoiDeNghiUid`, trong khi màn hình trống lại ghi *"Chưa có đề nghị nào do bạn lập hoặc
   * **có tên bạn trong danh sách theo dõi**"*. Nghĩa là ai được thêm vào danh sách theo dõi
   * mở trang này ra vẫn thấy trống trơn, và tin rằng chưa có hồ sơ nào — đúng cái bẫy
   * "giao diện hứa một việc app không làm" mà CLAUDE.md mục 3.5 cấm.
   *
   * 📌 Sửa BỘ LỌC chứ không sửa lời văn: được thêm vào danh sách theo dõi chính là để nắm
   * tiến trình, mà đây là trang tiến trình. Người được chia việc cũng phải thấy phần việc của
   * mình. Trang này vốn không hiện giá và nhà cung cấp nên mở rộng ở đây không hở thông tin.
   */
  const danhSach = useMemo(() => {
    const nguon = quyen.xemMoiHoSo
      ? deNghi
      : deNghi.filter(
          (dn) =>
            dn.nguoiDeNghiUid === nguoiDung.uid ||
            laViecCuaToi(dn, nguoiDung.uid) ||
            laNguoiTheoDoi(dn, nguoiDung.uid),
        );
    return nguon.map((dn) => {
      const tienDo = tinhTienDoDeNghi(dn, donHang, phieuNhan);
      return {
        dn,
        tienDo,
        tomTat: tomTatTienDoDeNghi(tienDo),
        // Giai đoạn SUY RA từ chứng từ thật, không thêm trường mới — xem `xacDinhGiaiDoan`.
        giaiDoan: xacDinhGiaiDoan(dn, donHang, baoGia, phieuNhan),
      };
    });
  }, [deNghi, donHang, baoGia, phieuNhan, nguoiDung.uid, quyen.xemMoiHoSo]);

  /**
   * ★ ĐANG GOM THEO CÁCH NÀO — Ban lãnh đạo 23/08/2026.
   *
   * 📌 Mặc định vẫn là CÔNG TRÌNH: đó là cách đã chốt 22/08/2026 và cả phòng đang quen. Phòng
   * ban là góc nhìn THÊM, không thay thế.
   *
   * ⚠️ PHẢI KHAI TRƯỚC `dongHienThi`. `useMemo` đọc `nhomTheo` ngay trong lượt vẽ (cả thân hàm
   * lẫn mảng phụ thuộc), nên khai sau là chạm vùng chưa khởi tạo của `const` — trang trắng kèm
   * `ReferenceError`, mà `npm run build` thì vẫn PASS vì lỗi chỉ hiện lúc chạy.
   */
  const [nhomTheo, setNhomTheo] = useState<CachGomNhom>("cong_trinh");

  /**
   * ★ GOM NHÓM THEO TÊN CÔNG TRÌNH — Ban lãnh đạo 22/08/2026: *"tên đề nghị này hãy hiển thị
   * theo: mã đề nghị + Tên đề xuất và được nhóm lại theo tên công trình"*.
   *
   * 🔴 ĐỔI TIÊU CHÍ GOM (trước 22/08 gom theo `deNghiGocId` — phiếu gốc và các bản tách của nó).
   * Cách cũ đúng với việc "một đề xuất tách thành nhiều phiếu", nhưng người theo dõi công trình
   * lại cần câu trả lời khác: **công trình này đang có những đề nghị nào**. Với cách cũ, hai đề
   * nghị của cùng một công trình nằm ở hai nhóm rời nhau, phải tự nhớ chúng cùng một chỗ —
   * đúng cảnh trong ảnh Ban lãnh đạo gửi (`…Howell-PR-001` và `…Howell-PR-002` thành hai nhóm).
   *
   * 📌 KHÔNG MẤT thông tin tách phiếu: bản tách luôn cùng công trình với phiếu gốc nên vẫn nằm
   * chung nhóm, và mã phiếu vẫn mang phần `(copy)` để nhận ra.
   *
   * 🔴 Khóa gom là tên công trình ĐÃ CHUẨN HÓA (bỏ dấu, gộp khoảng trắng, không phân biệt hoa
   * thường). Cùng một công trình mà người này gõ *"Công trình AID"*, người kia *"cong trinh aid"*
   * thì so chuỗi thô sẽ ra hai nhóm — mà đó mới đúng là cái Ban lãnh đạo muốn tránh.
   *
   * ⚠️ Đề nghị CHƯA GHI công trình vẫn phải hiện, gom vào một nhóm riêng có tên rõ ràng. Bỏ qua
   * chúng là hồ sơ biến mất khỏi màn theo dõi mà không ai biết.
   *
   * 📌 Trả về DANH SÁCH PHẲNG có xen dòng tiêu đề, không phải cây lồng nhau. Lồng thêm một
   * cấp thì 90 dòng JSX bên dưới phải thụt lại hết — diff phình lên mà giao diện không
   * khác gì. Thẻ thuộc nhóm nhận viền trái để mắt thấy chúng đi cùng nhau.
   */
  const dongHienThi = useMemo(() => {
    /** Tên công trình hiển thị cho từng khóa nhóm — lấy đúng cách người dùng đã gõ lần đầu. */
    const tenNhom = new Map<string, string>();

    const map = new Map<string, typeof danhSach>();
    for (const m of danhSach) {
      /* Khóa tính bằng hàm dùng chung với `hienThe` — xem lý do ở `khoaNhom`. */
      const khoa = khoaNhom(m.dn, nhomTheo);
      if (!tenNhom.has(khoa)) tenNhom.set(khoa, tenNhomHienThi(m.dn, nhomTheo));
      map.set(khoa, [...(map.get(khoa) ?? []), m]);
    }
    const ra: (
      /* `ma` nay giữ TÊN CÔNG TRÌNH (từ 22/08/2026), không còn là mã phiếu gốc. Giữ nguyên tên
         trường để 90 dòng JSX bên dưới không phải sửa theo. */
      | { loai: "nhom"; id: string; ma: string; ds: typeof danhSach }
      | ((typeof danhSach)[number] & { loai: "the"; trongNhom: boolean })
      /**
       * 🔴 DÒNG THU GỌN Ở CUỐI NHÓM — Ban lãnh đạo 17/08/2026: *"bung xem chi tiết từng mặt
       * hàng ra xong ko group lại được"*.
       *
       * Đã đo trên máy: phép gập/mở CHẠY ĐÚNG (`aria-expanded` đảo, chữ trong vùng nội dung
       * 223 → 520 ký tự). Cái sai là KHÔNG CÒN CHỖ BẤM: nhóm 3 phiếu bung ra cao hơn 800px,
       * nên dòng tiêu đề — chỗ duy nhất gập lại được — trôi hẳn khỏi màn hình. Người dùng
       * thấy đúng như "không gập lại được", dù mã không hỏng.
       *
       * Nên thêm một dòng gập ngay dưới thẻ cuối: gập được tại chỗ đang đứng, không phải
       * cuộn ngược lên tìm.
       */
      | { loai: "cuoi_nhom"; id: string; ma: string; soPhieu: number }
    )[] = [];
    /**
     * ★ NHÓM CÓ VIỆC CỦA MÌNH LÊN ĐẦU — Ban lãnh đạo 15/08/2026.
     *
     * 🔴 Trước đây trang này KHÔNG sắp xếp gì cả: thứ tự nhóm là thứ tự chèn vào `Map`, tức
     * thứ tự đề nghị trong kho dữ liệu. Nghĩa là hồ sơ lập trước luôn nằm trên, dù người đang
     * xem chẳng liên quan gì tới nó.
     *
     * 📌 Xếp nhóm theo phiếu ĐẠI DIỆN (phiếu đầu sau khi sắp xếp trong nhóm) — nhóm nào có
     * phần việc của mình thì phiếu đại diện của nó là việc của mình, nên nhóm nổi lên trên.
     */
    const nhomSapXep = [...map.entries()].sort(([, dsA], [, dsB]) =>
      soSanhDeNghiUuTien(dsA[0].dn, dsB[0].dn, nguoiDung.uid),
    );
    /* ⚠️ Tên biến là `khoa`, KHÔNG phải `khoaNhom` — `khoaNhom` nay là tên HÀM tính khóa ở đầu
       file. Trùng tên thì biến vòng lặp che mất hàm và mọi lời gọi trong vòng này sẽ hỏng. */
    for (const [khoa, ds] of nhomSapXep) {
      /**
       * ★ GOM NHÓM CẢ PHIẾU KHÔNG TÁCH — Ban lãnh đạo 15/08/2026: *"mục này dù không tách
       * đơn hàng thì cũng phải group lại cho gọn giống các đề nghị tách"*.
       *
       * 🔴 Trước đây chỉ nhóm khi có từ 2 phiếu (`ds.length > 1`), nên trang thành hai kiểu
       * trình bày lẫn lộn: phiếu đã tách gọn thành một dòng, phiếu chưa tách bung nguyên tấm
       * thẻ cao gấp năm lần. Mắt phải nhảy giữa hai nhịp, và muốn xem lướt cả trang thì thẻ
       * to chiếm hết màn hình.
       *
       * 📌 Nay MỌI đề nghị đều có một dòng gập, mặc định thu gọn. Trang thành một danh sách
       * đều nhau, bung ra cái nào cần xem kỹ.
       */
      const trongNhom = true;
      /* Trong một công trình, xếp đề nghị theo MÃ để thứ tự ổn định giữa các lần mở trang —
         `PR-001` trước `PR-002`, và bản `(copy)` đứng ngay sau phiếu gốc của nó. */
      const sapXep = [...ds].sort((a, b) => a.dn.code.localeCompare(b.dn.code, "vi"));
      const tenNhomNay = tenNhom.get(khoa) ?? "Chưa ghi";
      ra.push({
        loai: "nhom",
        id: khoa,
        /* Tiêu đề nhóm là TÊN CÔNG TRÌNH hoặc TÊN PHÒNG BAN, tùy cách gom đang chọn. */
        ma: tenNhomNay,
        ds: sapXep,
      });
      for (const m of sapXep) ra.push({ ...m, loai: "the", trongNhom });
      ra.push({
        loai: "cuoi_nhom",
        id: khoa,
        ma: tenNhomNay,
        soPhieu: sapXep.length,
      });
    }
    return ra;
  }, [danhSach, nguoiDung.uid, nhomTheo]);

  /**
   * Nhóm đang MỞ. Ban lãnh đạo 13/08/2026: *"thêm nút group lại cho gọn nha"* — nên mặc
   * định các nhóm THU GỌN, bấm mới bung ra.
   *
   * ⚠️ Giữ danh sách "đang mở" chứ không phải "đang gọn": nhóm mới xuất hiện (ai đó vừa
   * tách phiếu) sẽ mặc định gọn theo đúng ý trên. Làm ngược lại thì mỗi nhóm mới lại tự
   * bung ra, và màn hình dài thêm mà không ai bấm gì.
   */
  const [nhomMo, setNhomMo] = useState<Set<string>>(new Set());

  /**
   * Đổi cách gom thì DỌN danh sách nhóm đang mở.
   *
   * 🔴 KHÔNG PHẢI DỌN CHO SẠCH SẼ — bắt buộc. Khóa nhóm của hai cách gom khác nhau hoàn toàn
   * (tên công trình đã chuẩn hóa ≠ mã phòng ban), nên giữ lại khóa cũ là `nhomMo` chứa những
   * khóa **không thuộc cách gom hiện tại**. Chúng không khớp nhóm nào nên nằm im, nhưng nếu về
   * sau có công trình tên đúng bằng một mã phòng ban thì nhóm đó tự bung ra không rõ vì sao.
   */
  function doiCachNhom(cach: CachGomNhom) {
    setNhomTheo(cach);
    setNhomMo(new Set());
  }
  function doiMoNhom(id: string) {
    setNhomMo((truoc) => {
      const s = new Set(truoc);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }
  /**
   * Thẻ có được hiện không: không thuộc nhóm nào, hoặc thuộc nhóm đang mở.
   *
   * 🔴 KHÓA NHÓM PHẢI TÍNH ĐÚNG NHƯ LÚC GOM (`dongHienThi`) — từ 22/08/2026 là tên công trình
   * đã chuẩn hóa, không còn là `deNghiGocId`. Hai chỗ tính khóa khác nhau thì bấm mở nhóm mà
   * thẻ không hiện, và không có lỗi nào báo ra.
   */
  function hienThe(m: { trongNhom: boolean; dn: DeNghiMuaHang }) {
    if (!m.trongNhom) return true;
    return nhomMo.has(khoaNhom(m.dn, nhomTheo));
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Theo dõi đề nghị" }]}
        title="Theo dõi đề nghị"
        description="Tiến trình hồ sơ đề nghị mua hàng — không hiển thị giá và nhà cung cấp"
      />

      {danhSach.length === 0 ? (
        /* 📌 ĐÃ BỎ nút "Tạo đề nghị mua hàng" ở đây (Ban lãnh đạo 15/08/2026: *"bỏ mục chọn
           này, đang bị dư"*).

           Đây là màn TRA CỨU tiến trình, không phải nơi lập hồ sơ — đường lập đề nghị đã nằm
           ở trang Quy trình mua hàng. Nút còn dư ở đây gây hai chuyện: người vào tra tiến độ
           bị mời làm một việc khác, và vai trò như thủ kho (ảnh Ban lãnh đạo gửi) thấy nút
           lập đề nghị mua hàng ngay trên màn của mình. */
        <EmptyState
          icon={Eye}
          title="Chưa có đề nghị nào để theo dõi"
          // Nêu ĐỦ ba đường vào, đúng bằng bộ lọc ở trên — không hứa hơn, không giấu bớt.
          description="Chưa có đề nghị nào do bạn lập, được giao cho bạn, hoặc có tên bạn trong danh sách theo dõi."
        />
      ) : (
        <div className="flex flex-col gap-(--hp-md-card-gap)">
          {/**
            * ★ CHỌN CÁCH GOM NHÓM — Ban lãnh đạo 23/08/2026: *"thêm chức năng group theo tên công
            * trình / Tên phòng ban"*.
            *
            * 📌 Dùng `<button>` thật trong `role="tablist"`, cùng kiểu dải tab "Dạng bảng / Danh
            * sách" ở trang Quy trình mua hàng — người dùng đã quen thao tác đó, và bấm bằng Tab /
            * Enter được. `min-h-11` cho đủ vùng chạm 44px (V1.1 Phần F).
            */}
          <div
            className="flex flex-wrap items-center gap-2"
            role="tablist"
            aria-label="Cách gom nhóm hồ sơ"
          >
            <span className="text-xs font-semibold tracking-wide text-text-desc uppercase">
              Nhóm theo
            </span>
            {(Object.keys(NHAN_CACH_NHOM) as CachGomNhom[]).map((c) => {
              const dangChon = nhomTheo === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={dangChon}
                  onClick={() => doiCachNhom(c)}
                  className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm font-medium transition-colors ${
                    dangChon
                      ? "border-primary bg-primary-bg text-primary"
                      : "border-border text-text-secondary hover:border-primary hover:text-primary"
                  }`}
                >
                  {NHAN_CACH_NHOM[c]}
                </button>
              );
            })}
          </div>

          {dongHienThi.map((m) => {
            // Dòng tiêu đề của một nhóm phiếu đã tách — bấm cả dòng để mở / thu gọn.
            if (m.loai === "nhom") {
              const dangMo = nhomMo.has(m.id);
              return (
                <button
                  key={`nhom-${m.id}`}
                  type="button"
                  onClick={() => doiMoNhom(m.id)}
                  aria-expanded={dangMo}
                  className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-primary/30 bg-primary-bg px-3 py-2 text-left text-sm transition-colors hover:border-primary"
                >
                  <ChevronRight
                    className={`size-4 shrink-0 text-primary transition-transform ${dangMo ? "rotate-90" : ""}`}
                    aria-hidden
                  />
                  {/* Biểu tượng nhánh: nhóm có nhiều đề nghị của cùng một công trình. */}
                  {m.ds.length > 1 && (
                    <GitBranch className="size-4 shrink-0 text-primary" aria-hidden />
                  )}
                  {/* ★ TIÊU ĐỀ NHÓM LÀ TÊN CÔNG TRÌNH (22/08/2026). Trước đây là mã phiếu gốc
                      kèm tiêu đề — mà tiêu đề đề nghị thường lặp gần đúng tên công trình, nên
                      một dòng in gần như hai lần cùng một chuỗi. */}
                  <span className="min-w-0 truncate font-semibold text-text-primary">{m.ma}</span>
                  <span className="rounded bg-card px-1.5 py-0.5 text-xs font-medium text-primary">
                    {m.ds.length > 1 ? `${m.ds.length} đề nghị` : "1 đề nghị"}
                  </span>
                  {/* 🔴 Khi GỌN vẫn phải thấy nhóm đang ở đâu, nếu không thu gọn chỉ là
                      giấu thông tin. Hiện mã từng phiếu kèm bước hiện tại — đủ để quyết
                      định có cần bung ra hay không. */}
                  {!dangMo && (
                    <span className="flex w-full flex-col gap-1 pt-0.5 pl-6">
                      {m.ds.map((x) => (
                        <span
                          key={x.dn.id}
                          className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs"
                        >
                          {/* ★ MÃ ĐỀ NGHỊ + TÊN ĐỀ XUẤT — Ban lãnh đạo 22/08/2026.
                              Mã đứng trước để tra hồ sơ, tên đề xuất theo sau để biết mua gì.
                              Tên công trình KHÔNG lặp lại ở đây: nó đã là tiêu đề của nhóm. */}
                          {/**
                            * ★ THÊM MÃ SỐ ĐỀ NGHỊ BÊN APP ĐỀ NGHỊ — Ban lãnh đạo 23/08/2026:
                            * *"Mục này hãy hiển thị cả mã số đề nghị"*.
                            *
                            * 🔴 ĐÂY LÀ MÃ THỨ HAI, KHÔNG THAY MÃ CŨ. `maDeXuatAppRequest` (dạng
                            * `000000041`) là số người đề nghị và các phòng ban dùng để gọi tên hồ
                            * sơ; `code` (`43/2025/HĐXD-HPCS-…-PR-001`) là mã hồ sơ của app theo
                            * Thông báo 09/2026. Bỏ một trong hai là một nửa người đọc mất mã họ
                            * đang tra.
                            *
                            * 📌 Chỉ hiện khi CÓ. Hồ sơ lập trước ngày nối App Request không có mã
                            * này — vẽ một ô trống hay chữ "—" chỉ làm dòng rối thêm.
                            */}
                          {x.dn.maDeXuatAppRequest && (
                            <span className="rounded bg-card px-1.5 py-0.5 font-semibold text-primary">
                              {x.dn.maDeXuatAppRequest}
                            </span>
                          )}
                          <span className="font-medium text-text-primary">{x.dn.code}</span>
                          <span className="min-w-0 truncate text-text-secondary">
                            {x.dn.tieuDe}
                          </span>
                          <span className="rounded bg-card px-1.5 py-0.5 text-text-desc">
                            {NHAN_GIAI_DOAN[x.giaiDoan].nhan}
                          </span>
                        </span>
                      ))}
                    </span>
                  )}
                </button>
              );
            }
            /* Dòng thu gọn cuối nhóm — chỉ vẽ khi nhóm ĐANG MỞ. Nhóm gọn rồi thì thêm một
               dòng "Thu gọn" nữa là vô nghĩa. Xem lý do ở khai báo `cuoi_nhom`. */
            if (m.loai === "cuoi_nhom") {
              if (!nhomMo.has(m.id)) return null;
              return (
                <button
                  key={`cuoi-${m.id}`}
                  type="button"
                  onClick={() => doiMoNhom(m.id)}
                  /* Lùi vào 12px cho thẳng với các thẻ trong nhóm (`ml-3`), để thấy ngay dòng
                     này thuộc nhóm phía trên chứ không phải một mục mới. */
                  className="ml-3 flex min-h-11 w-full items-center gap-2 rounded-lg border border-border border-dashed bg-card px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  <ChevronRight className="size-4 shrink-0 rotate-[-90deg]" aria-hidden />
                  <span className="min-w-0 truncate">
                    Thu gọn {nhomTheo === "phong_ban" ? "phòng ban" : "công trình"} {m.ma}
                  </span>
                  <span className="shrink-0 text-xs text-text-desc">
                    ({m.soPhieu} đề nghị)
                  </span>
                </button>
              );
            }
            if (!hienThe(m)) return null;
            const { dn, tienDo, tomTat, giaiDoan } = m;
            const tt = nhanAnToan(NHAN_TRANG_THAI_DE_NGHI, dn.trangThai);
            const buoc = NHAN_GIAI_DOAN[giaiDoan];
            return (
              <Card
                key={dn.id}
                // Viền trái + lùi vào: thấy ngay thẻ này thuộc nhóm phía trên, mà không
                // phải lồng thêm một lớp khung bọc quanh cả nhóm.
                className={m.trongNhom ? "ml-3 border-l-4 border-l-primary" : undefined}
              >
                <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      {/* Mã số bên App Đề nghị đứng trên mã hồ sơ của app — cùng lý do với dòng
                          gọn của nhóm (23/08/2026). */}
                      {dn.maDeXuatAppRequest && (
                        <span className="text-xs font-semibold text-primary">
                          Mã đề nghị {dn.maDeXuatAppRequest}
                        </span>
                      )}
                      <Link
                        href={`/theo-doi/${dn.id}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {dn.code}
                      </Link>
                      <span className="text-sm text-text-primary">{dn.tieuDe}</span>
                      {/* Ở cách gom theo PHÒNG BAN thì tên công trình chưa nằm ở tiêu đề nhóm,
                          nên dòng này là chỗ duy nhất đọc được nó — giữ nguyên cho cả hai cách. */}
                      <span className="text-xs text-text-desc">
                        {dn.tenCongTrinh}
                        {nhomTheo === "cong_trinh" && dn.phongBanNguon
                          ? ` · ${nhanPhongBan(dn.phongBanNguon)}`
                          : ""}
                      </span>
                    </div>
                    {/* Bước hiện tại đứng cạnh trạng thái: người đề nghị cần biết hồ sơ
                        đang nằm ở đâu, không chỉ "đã duyệt" hay "hoàn thành". */}
                    <span className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge label={buoc.nhan} tone={buoc.tong} />
                      <StatusBadge label={tt.nhan} tone={tt.tong} />
                    </span>
                  </div>

                  {/* ---- Phòng Thu mua đã phân công chưa ---- */}
                  <DongPhanCong deNghi={dn} hienTen={quyen.xemNguoiPhuTrach} />

                  <TimelineDeNghi
                    ngayDuyet={dn.ngayDuyet}
                    ngayCanHang={dn.ngayCanHang}
                    soDongDaNhanDu={tomTat.soDongDaNhanDu}
                    tongSoDong={tomTat.tongSoDong}
                    soDongDaPhanBo={tienDo.filter((d) => d.trangThaiDong !== "chua_phan_bo").length}
                    soDongDaLenPO={tienDo.filter((d) => d.maPOLienQuan.length > 0).length}
                  />

                  <Link
                    href={`/theo-doi/${dn.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Xem chi tiết từng mặt hàng →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

/**
 * Một dòng cho biết Phòng Thu mua đã phân công người phụ trách chưa.
 *
 * 🔴 THAY CHO "ĐÃ TIẾP NHẬN" — Ban lãnh đạo 12/08/2026 bỏ hẳn bước bấm "Nhận công tác"
 * (*"Trưởng phòng giao việc thì chắc chắn phải làm nên không cần bước bấm xác nhận này"*).
 *
 * Dựa vào PHÂN BỔ thay vì một cái nút xác nhận là thông tin **đúng hơn**: nó phản ánh việc
 * đã có người thật đang làm, chứ không phải ai đó đã bấm một nút. Người đề nghị vẫn có đúng
 * câu trả lời họ cần — *"đã ai lo việc này chưa"* — mà không phải chờ thêm một thao tác.
 *
 * 🔴 Tách thành component vì màn danh sách và màn chi tiết đều dùng — chép hai lần thì sửa
 * một chỗ là chỗ kia lệch, mà đây là câu trả lời cho đúng thứ người đề nghị muốn biết nhất.
 */
export function DongPhanCong({
  deNghi,
  /** Vai trò được xem tên nhân viên thu mua hay không. */
  hienTen,
}: {
  deNghi: DeNghiMuaHang;
  hienTen: boolean;
}) {
  const nguoiPhuTrach = [
    ...new Set(
      deNghi.items.map((d) => d.nguoiPhuTrachTen).filter((x): x is string => Boolean(x)),
    ),
  ];
  const soDaPhan = deNghi.items.filter((d) => d.nguoiPhuTrachUid).length;

  if (soDaPhan === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
        <Clock className="size-4 shrink-0 text-warning-soft" aria-hidden />
        <span>
          <strong>Chờ Phòng Thu mua phân công.</strong> Khi có người nhận phần việc, dòng này sẽ
          tự đổi — không cần gọi hỏi.
        </span>
      </p>
    );
  }

  const xong = soDaPhan === deNghi.items.length;
  return (
    <p
      className={`flex items-center gap-2 rounded-lg border p-(--hp-md-row-pad) text-sm text-text-secondary ${
        xong ? "border-success bg-success-bg" : "border-warning bg-warning-bg"
      }`}
    >
      <UserCheck
        className={`size-4 shrink-0 ${xong ? "text-success-soft" : "text-warning-soft"}`}
        aria-hidden
      />
      <span>
        <strong>
          Phòng Thu mua đã phân công {soDaPhan}/{deNghi.items.length} mặt hàng
        </strong>
        {/* 🔒 Giấu TÊN người phụ trách với vai trò không được xem (Phòng Thi công). Họ chỉ
            cần biết đã có người lo, không cần biết nhân sự nội bộ phòng thu mua. */}
        {hienTen && nguoiPhuTrach.length > 0 ? ` — ${nguoiPhuTrach.join(", ")}` : ""}
      </span>
    </p>
  );
}
