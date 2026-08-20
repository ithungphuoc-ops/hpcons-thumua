"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
import type { BaoGia, NhaCungCap } from "@/3-du-lieu/kieu-du-lieu";

/**
 * ★ KHỐI ĐỀ XUẤT BÁO GIÁ CỦA NHÂN VIÊN — bước ②, **không nhập số liệu giá**.
 *
 * 🔴 Ban lãnh đạo 19/08/2026: *"chưa cần chức năng nhập số liệu NCC, chỉ cần đính kèm file báo
 * giá là được"*, sau khi yêu cầu *"nhân viên gửi đính kèm file báo giá và ghi rõ thông tin đề
 * xuất báo giá chọn → bấm trình xét duyệt"*.
 *
 * ## VÌ SAO KHÔNG DÙNG `KhoiThuThapBaoGia`
 * Khối đó làm việc khác: nhập đơn giá từng dòng vật tư cho từng nhà cung cấp để dựng **bảng so
 * sánh giá**. Cả phần đề xuất lẫn nút trình của nó đều đòi *"đã nhập giá của ít nhất một nhà cung
 * cấp"* — bỏ điều kiện ấy đi là phá luật của chính nó. Đây là hai chế độ làm việc khác nhau, không
 * phải hai bản chép tay của một biểu mẫu:
 *   · Khối kia = **so sánh giá trong app** (dùng khi cần bảng so sánh, tách đơn nhiều NCC).
 *   · Khối này = **báo giá nằm trong tệp đính kèm**, app chỉ giữ đề xuất và chuyển bước.
 *
 * ## 📌 TỆP ĐÍNH KÈM KHÔNG NẰM Ở ĐÂY
 * Việc đính kèm dùng khu đính kèm của bước ② (`KhuDinhKemGiaiDoan`) đã có sẵn ngay phía trên —
 * không dựng thêm chỗ bỏ tệp thứ hai trong cùng một bước.
 *
 * ## 🔴 KHÔNG BẮT CHỌN TỪ DANH MỤC
 * Cùng nguyên tắc đã chốt cho màn lập đơn (10/08/2026) và màn nhập giá (11/08/2026): báo giá đến
 * từ bất kỳ nhà cung cấp nào, danh mục chạy thử chỉ có vài cái. Bắt chọn trong đó thì người dùng
 * gán bừa một tên khác, và mọi chứng từ sau này sai đối tượng. Ô này gõ tự do, có `list` gợi ý.
 */
export function KhoiDeXuatBaoGia({
  baoGia,
  nhaCungCap,
  onLuuDeXuat,
  onTrinhXetDuyet,
  vuongMacBenNgoai,
}: {
  baoGia: BaoGia;
  /** Chỉ để GỢI Ý khi gõ, không giới hạn lựa chọn. */
  nhaCungCap: NhaCungCap[];
  onLuuDeXuat: (deXuat: { nccId: string; tenNCC: string; lyDo: string }) => void;
  onTrinhXetDuyet: () => void;
  /**
   * Vướng mắc do TRANG CHỨA quyết định — hiện tại là *"chưa đính kèm đủ số bản báo giá"*
   * (Ban lãnh đạo 20/08/2026).
   *
   * 🔴 NHẬN VÀO TỪ NGOÀI, không tự tính trong này: luật đếm báo giá thuộc `2-quy-trinh/` và cần
   * cả `DeNghiMuaHang` (tệp đính kèm nằm trên đề nghị, không nằm trên bảng báo giá). Component
   * này chỉ biết bảng báo giá, nên tự tính là phải kéo thêm dữ liệu vào đây — và sẽ thành chỗ
   * thứ hai giữ cùng một luật.
   */
  vuongMacBenNgoai?: string | null;
}) {
  const [tenNCC, setTenNCC] = useState(baoGia.deXuatNCCTen ?? "");
  const [lyDo, setLyDo] = useState(baoGia.lyDoDeXuat ?? "");

  /**
   * Đồng bộ khi dữ liệu máy chủ đổi (kho dùng chung cả phòng).
   * ⚠️ Chỉ nạp khi hồ sơ ĐỔI THẬT, không nạp mỗi lần vẽ lại — nếu không thì mỗi lần kho chung có
   * tin mới là đè lên chữ người dùng đang gõ dở.
   */
  useEffect(() => {
    setTenNCC(baoGia.deXuatNCCTen ?? "");
    setLyDo(baoGia.lyDoDeXuat ?? "");
  }, [baoGia.deXuatNCCTen, baoGia.lyDoDeXuat]);

  /**
   * Còn thiếu gì mới trình được — `null` là đủ. Luôn trả CÂU GIẢI THÍCH, không trả boolean.
   *
   * 🔴 XÉT VƯỚNG MẮC BÊN NGOÀI TRƯỚC (chưa đủ bản báo giá): đó là điều kiện bắt buộc của quy
   * trình, nặng hơn việc còn thiếu chữ trong ô đề xuất. Nói cái nặng trước thì người dùng đi
   * làm đúng việc cần làm.
   */
  const thieu: string | null =
    (vuongMacBenNgoai ?? null) !== null
      ? vuongMacBenNgoai!
      : tenNCC.trim() === ""
        ? "Ghi nhà cung cấp bạn đề xuất trước khi trình."
        : lyDo.trim() === ""
          ? "Ghi dẫn chứng cụ thể cho đề xuất trước khi trình."
          : null;

  const daLuu =
    tenNCC.trim() === (baoGia.deXuatNCCTen ?? "") && lyDo.trim() === (baoGia.lyDoDeXuat ?? "");

  function luu() {
    const ten = tenNCC.trim();
    /* Tra danh mục để lấy `nccId` thật; không tra ra thì sinh khóa từ tên đã chuẩn hóa. Có khóa
       thì chứng từ sau này (đơn hàng, công nợ) còn nối được về đúng một đối tượng, thay vì so
       chuỗi tên mà hoa/thường lệch một chữ là thành hai nhà cung cấp khác nhau. */
    const trongDanhMuc = nhaCungCap.find(
      (n) => n.ten.trim().toLowerCase() === ten.toLowerCase(),
    );
    onLuuDeXuat({
      nccId: trongDanhMuc?.id ?? `ncc-tu-go-${ten.toLowerCase().replace(/\s+/g, "-")}`,
      tenNCC: ten,
      lyDo: lyDo.trim(),
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-(--hp-md-card-pad)">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="de-xuat-ncc">Đề xuất chọn nhà cung cấp nào? *</Label>
        <Input
          id="de-xuat-ncc"
          list="goi-y-ncc-de-xuat"
          value={tenNCC}
          onChange={(e) => setTenNCC(e.target.value)}
          placeholder="Gõ tên nhà cung cấp — không có trong danh mục vẫn gõ được"
        />
        <datalist id="goi-y-ncc-de-xuat">
          {nhaCungCap.map((n) => (
            <option key={n.id} value={n.ten} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="de-xuat-ly-do">Dẫn chứng cụ thể *</Label>
        <Textarea
          id="de-xuat-ly-do"
          rows={3}
          value={lyDo}
          onChange={(e) => setLyDo(e.target.value)}
          placeholder="Ví dụ: bên A rẻ hơn bên B 4,2% trên tổng · giao trong 5 ngày đáp ứng tiến độ đợt 1 · đã làm 2 công trình trước không sự cố."
        />
        {/* 🔴 Giữ đúng phần HƯỚNG DẪN GHI của khối nhập giá: đây là chỗ dễ làm cho có nhất, mà
            dẫn chứng sơ sài thì trưởng bộ phận không có gì để quyết và về sau không giải trình
            được với Ban lãnh đạo. */}
        <p className="text-xs text-text-desc">
          Ghi <strong>con số và dữ kiện</strong>, đừng ghi “giá tốt”. Trưởng bộ phận đọc phần này
          để quyết, và đây cũng là căn cứ khi cần giải trình về sau.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" disabled={daLuu} onClick={luu}>
          Lưu đề xuất
        </Button>

        {/* 🔴 NÚT TRÌNH KHÓA KÈM LÝ DO, không khóa im lặng: nút mờ mà không nói còn thiếu gì là
            kiểu bí việc khó chịu nhất — người dùng bấm mãi không được và chẳng biết vì sao. */}
        <Button
          size="sm"
          disabled={thieu !== null || !daLuu}
          title={thieu ?? (!daLuu ? "Lưu đề xuất trước khi trình." : undefined)}
          onClick={onTrinhXetDuyet}
        >
          <Send className="size-4" aria-hidden />
          Trình xét duyệt báo giá
        </Button>

        {(thieu !== null || !daLuu) && (
          <span className="text-xs text-warning-soft">
            {thieu ?? "Bấm “Lưu đề xuất” trước khi trình."}
          </span>
        )}
      </div>
    </div>
  );
}
