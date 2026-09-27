"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Clock, Eye, UserCheck } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { duongDanGocTheoQuyen } from "@/2-quy-trinh/dieu-huong";
import { khoaCongTrinh, NHOM_CHUA_GHI_CONG_TRINH } from "@/2-quy-trinh/gom-cong-trinh";
import { nhanPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";
import { tinhTienDoDeNghi, tomTatTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import { dungBangQuyTrinh, xacDinhGiaiDoan } from "@/2-quy-trinh/giai-doan-mua-hang";
import { vuongMacTrinhXetDuyet } from "@/2-quy-trinh/bao-gia-dinh-kem";
import { locTienDoConPhaiMua } from "@/2-quy-trinh/nhan-ban-de-nghi";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/1-giao-dien/nen-tang-ui/table";
import {
  DauBangDanhSachHoSo,
  DongDanhSachHoSo,
  SO_COT_DANH_SACH_HO_SO,
  TheDanhSachHoSo,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/danh-sach-ho-so";
import { BangHangDaDat, TheHangDaDat } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-hang-da-dat";
import { soSanhDeNghiUuTien } from "@/2-quy-trinh/sap-xep-uu-tien";
import { duocXemTienTrinhDeNghi } from "@/4-phan-quyen/quyen-theo-ho-so";
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
/* (25/09/2026) Khoá nhóm công trình dời sang `2-quy-trinh/gom-cong-trinh.ts` để màn Công nợ dùng
   chung — xem `khoaCongTrinh`. */

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
  return khoaCongTrinh(dn.tenCongTrinh);
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
  const { deNghi, donHang, baoGia, phieuNhan, cauHinh, thongBao } = useDuLieu();
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
    /* (25/09/2026) Luật "ai xem được đề nghị nào" dời sang `duocXemTienTrinhDeNghi` để trang chi
       tiết `/theo-doi/[id]` dùng CHUNG — trang đó trước đây không kiểm gì. */
    const nguon = deNghi.filter((dn) => duocXemTienTrinhDeNghi(dn, nguoiDung.uid, quyen));
    return nguon.map((dn) => {
      const tienDo = tinhTienDoDeNghi(dn, donHang, phieuNhan);
      /* ★ Bảng "Hàng đã đặt" (27/09/2026): trừ dòng đã tách hết sang phiếu con — không thì phiếu gốc
         báo "chưa lên đơn" cho dòng mà phiếu con đang mua, người đọc tưởng mua thiếu. */
      const tienDoPhaiMua = locTienDoConPhaiMua(dn, deNghi, tienDo);
      return {
        dn,
        tienDo,
        tienDoPhaiMua,
        soDongDaTach: tienDo.length - tienDoPhaiMua.length,
        tomTat: tomTatTienDoDeNghi(tienDo),
        /* Giai đoạn SUY RA từ chứng từ thật, không thêm trường mới — xem `xacDinhGiaiDoan`.
           🔴 PHẢI TRUYỀN `deNghi` (tham số cuối) — Sếp 15/09/2026: dòng đã nhân bản đi thì
           "không tính là chưa phân bổ". Thiếu tham số thì hàm cư xử như cũ, nghĩa là màn này
           hiện **giai đoạn khác** với bảng quy trình cho cùng một hồ sơ.
           ⚠️ Dùng `deNghi` GỐC từ kho, KHÔNG dùng `nguon` — `nguon` đã lọc theo người dùng nên
           có thể thiếu bản nhân bản, và thiếu là dòng không được trừ, sai âm thầm. */
        giaiDoan: xacDinhGiaiDoan(dn, donHang, baoGia, phieuNhan, deNghi),
      };
    });
  }, [deNghi, donHang, baoGia, phieuNhan, nguoiDung.uid, quyen]);

  /* ❌ ĐÃ BỎ Ô TÌM + CÁCH XEM "THEO MẶT HÀNG" (thêm 25/09/2026) — Sếp 26/09/2026: *"Bỏ mục này,
     ko cần thiết"*. Tìm hồ sơ dùng ô tìm chung trên thanh đầu trang. Cần tra lại: lịch sử git. */

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
   * ★★ THẺ DÙNG CHUNG VỚI BẢNG QUY TRÌNH — Sếp 27/09/2026 duyệt bản demo *"cửa sổ theo dõi đề nghị
   * có hiển thị tương tự vậy"* (dạng Danh sách của Quy trình mua hàng).
   *
   * 🔴 LẤY TỪ `dungBangQuyTrinh`, KHÔNG tự tính: giai đoạn, hạn, người phụ trách, chứng từ còn nợ
   * phải đúng bộ số của bảng quy trình — tự tính ở đây là màn Theo dõi nói khác bảng về cùng một hồ
   * sơ. `baoGomLuuTru`: người theo dõi vẫn cần thấy hồ sơ Thu mua đã lưu trữ cho gọn bảng.
   */
  const theTheoId = useMemo(() => {
    const cot = dungBangQuyTrinh(
      deNghi,
      donHang,
      baoGia,
      phieuNhan,
      cauHinh,
      new Date(),
      nguoiDung.uid,
      (dn) => vuongMacTrinhXetDuyet(dn, cauHinh),
      thongBao,
      true,
    );
    return new Map(cot.flatMap((c) => c.the).map((t) => [t.deNghi.id, t]));
  }, [deNghi, donHang, baoGia, phieuNhan, cauHinh, nguoiDung.uid, thongBao]);

  /**
   * Nhóm đang THU GỌN — ĐẢO so với trước 27/09/2026 (khi đó mặc định gọn): bản demo Sếp duyệt để
   * mọi nhóm mở sẵn, bấm dòng nhóm mới gọn lại. Giữ danh sách "đang gọn" để nhóm mới xuất hiện tự mở.
   */
  const [nhomDong, setNhomDong] = useState<Set<string>>(new Set());
  /** Đề nghị đang xổ bảng "Hàng đã đặt". */
  const [dongMo, setDongMo] = useState<Set<string>>(new Set());

  /**
   * Đổi cách gom thì DỌN danh sách nhóm đang gọn — khóa nhóm của hai cách gom khác nhau hoàn toàn
   * (tên công trình đã chuẩn hóa ≠ mã phòng ban); giữ khóa cũ là nhóm trùng tên tự gọn không rõ vì sao.
   */
  function doiCachNhom(cach: CachGomNhom) {
    setNhomTheo(cach);
    setNhomDong(new Set());
  }
  const doiTrongSet = (id: string) => (truoc: Set<string>) => {
    const moi = new Set(truoc);
    if (moi.has(id)) moi.delete(id);
    else moi.add(id);
    return moi;
  };

  return (
    <>
      <PageHeader
        /* 🔴 BREADCRUMB TRỎ VỀ CHÍNH MÀN NÀY, KHÔNG TRỎ `/tong-quan` — sửa 18/09/2026. Từ hôm nay
           người ngoài phòng Thu mua KHÔNG vào được `/tong-quan`; để nguyên là họ bấm "Thu mua" rồi
           bị cổng bảo vệ ném ngược về đây, mất chỗ đang đứng mà không hiểu vì sao. */
        crumbs={[
          { label: "Thu mua", href: duongDanGocTheoQuyen(quyen) },
          { label: "Theo dõi đề nghị" },
        ]}
        title="Theo dõi đề nghị"
        description="Tiến trình hồ sơ đề nghị mua hàng — không hiển thị giá và nhà cung cấp"
        /* 📌 ĐÃ BỎ NÚT "Tạo đề nghị" — Sếp 26/09/2026: *"Bỏ nút tạo đề nghị ở chức năng theo dõi
           đi"*. Đây là màn TRA CỨU tiến trình. Nút từng được đưa về 18/09/2026 để người ngoài Thu
           mua còn đường lập đề nghị; nay họ lập thẳng ở app Đề nghị (request.hpcore.vn). */
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

          {/* ★ BẢNG — cùng dạng "Danh sách" của Quy trình mua hàng (Sếp 27/09/2026). */}
          <Card>
            <CardContent className="flex min-w-0 flex-col gap-(--hp-md-card-gap)">
              {/* `[&>[data-slot=table-container]]:overflow-visible`: tắt khung cuộn riêng của `Table` để
                  div này là khung cuộn ngang thật (thanh cuộn dày `thanh-keo-ngang-ro`). */}
              <div className="thanh-keo-ngang-ro hidden overflow-x-auto md:block [&>[data-slot=table-container]]:overflow-visible">
                <Table>
                  <TableHeader className="bg-card">
                    <DauBangDanhSachHoSo canhGiua />
                  </TableHeader>
                  <TableBody>
                    {dongHienThi.map((m) => {
                      if (m.loai === "cuoi_nhom") return null;
                      if (m.loai === "nhom") {
                        const gon = nhomDong.has(m.id);
                        return (
                          <TableRow
                            key={`nhom-${m.id}`}
                            className="border-t-2 border-t-primary/40 hover:bg-transparent has-aria-expanded:bg-transparent"
                          >
                            {/* Nền đặt ở Ô (không ở dòng) — dòng có nút `aria-expanded` nên lớp gốc
                                `has-aria-expanded:bg-muted/50` của TableRow sẽ đè mất nền xanh. */}
                            <TableCell
                              colSpan={SO_COT_DANH_SACH_HO_SO}
                              className="border-l-4 border-l-primary bg-primary/15 py-1.5 whitespace-normal"
                            >
                              <button
                                type="button"
                                aria-expanded={!gon}
                                onClick={() => setNhomDong(doiTrongSet(m.id))}
                                className="sticky left-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-left text-sm md:min-h-9"
                              >
                                <ChevronRight
                                  className={`size-4 shrink-0 text-primary transition-transform ${gon ? "" : "rotate-90"}`}
                                  aria-hidden
                                />
                                <span className="text-base font-bold text-primary uppercase">{m.ma}</span>
                                <span className="text-xs text-text-desc">{m.ds.length} đề nghị</span>
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (nhomDong.has(khoaNhom(m.dn, nhomTheo))) return null;
                      const the = theTheoId.get(m.dn.id);
                      if (!the) return null;
                      return (
                        <DongDanhSachHoSo
                          key={m.dn.id}
                          the={the}
                          duongDan={`/theo-doi/${m.dn.id}`}
                          hienNguoiPhuTrach={quyen.xemNguoiPhuTrach}
                          canhGiua
                          anMoTaPhu
                          moRong={dongMo.has(m.dn.id)}
                          onDoiMoRong={() => setDongMo(doiTrongSet(m.dn.id))}
                          nhanMoRong="Xem hàng đã đặt"
                          noiDungMoRong={
                            <BangHangDaDat tienDo={m.tienDoPhaiMua} soDongDaTach={m.soDongDaTach} />
                          }
                        />
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Điện thoại — Card List (V1.1: bảng nhiều cột trên màn hẹp phải đổi sang thẻ). */}
              <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
                {dongHienThi.map((m) => {
                  if (m.loai === "cuoi_nhom") return null;
                  if (m.loai === "nhom") {
                    const gon = nhomDong.has(m.id);
                    return (
                      <button
                        key={`nhom-${m.id}`}
                        type="button"
                        aria-expanded={!gon}
                        onClick={() => setNhomDong(doiTrongSet(m.id))}
                        className="flex min-h-11 w-full items-center gap-2 rounded-lg border-l-4 border-l-primary bg-primary/15 px-3 py-2 text-left"
                      >
                        <ChevronRight
                          className={`size-4 shrink-0 text-primary transition-transform ${gon ? "" : "rotate-90"}`}
                          aria-hidden
                        />
                        <span className="text-sm font-bold text-primary uppercase">{m.ma}</span>
                        <span className="text-xs text-text-desc">{m.ds.length} đề nghị</span>
                      </button>
                    );
                  }
                  if (nhomDong.has(khoaNhom(m.dn, nhomTheo))) return null;
                  const the = theTheoId.get(m.dn.id);
                  if (!the) return null;
                  const mo = dongMo.has(m.dn.id);
                  return (
                    <TheDanhSachHoSo
                      key={m.dn.id}
                      the={the}
                      duongDan={`/theo-doi/${m.dn.id}`}
                      hienNguoiPhuTrach={quyen.xemNguoiPhuTrach}
                          canhGiua
                          anMoTaPhu
                      moRong={mo}
                      onDoiMoRong={() => setDongMo(doiTrongSet(m.dn.id))}
                      nhanMoRong={mo ? "Ẩn hàng đã đặt" : `Xem ${m.tienDoPhaiMua.length} mặt hàng đã đặt`}
                      noiDungMoRong={<TheHangDaDat tienDo={m.tienDoPhaiMua} soDongDaTach={m.soDongDaTach} />}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
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
