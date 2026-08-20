"use client";

import { useEffect, useState } from "react";
import { ChevronRight, LogIn, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { ODinhKemTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { ODinhKemNhieuTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-nhieu-tep";
// `TOI_DA_TEP_MOI_BUOC` là hạn mức THẬT của tầng dữ liệu — lấy về dùng, tuyệt đối không chép con
// số ra file giao diện (hai chỗ giữ cùng một con số là sớm muộn lệch nhau, mà lệch kiểu đó không có
// lỗi nào báo: ô nhập cho chọn 5 tệp còn tầng dữ liệu chặn ở 3).
import { useDuLieu, TOI_DA_TEP_MOI_BUOC } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { DANH_MUC_PHONG_BAN } from "@/3-du-lieu/danh-muc-phong-ban";
import { NHAN_GIAI_DOAN } from "@/2-quy-trinh/giai-doan-mua-hang";
import {
  NHAN_NHOM_DE_XUAT,
  type DeNghiMuaHang,
  type DongDeNghi,
  type MoTaTep,
  type NhomDeXuat,
} from "@/3-du-lieu/kieu-du-lieu";

/**
 * ✏️ HỘP "CHỈNH SỬA CÁC TRƯỜNG DỮ LIỆU TÙY CHỈNH" — dựng theo đúng ảnh Base mà Ban lãnh đạo gửi
 * ngày 18/08/2026: *"đây là giao diện chức năng 'chỉnh sửa dữ liệu tùy chỉnh', e cấu hình giống
 * 100% cho a"*.
 *
 * ---
 * ## VÌ SAO VIẾT MỚI THAY VÌ SỬA HỘP CŨ
 * Hộp cũ (`HopSuaTruongBoSung` trong `hop-sua-de-nghi.tsx`) mang đúng cái tên "Chỉnh sửa dữ liệu
 * tùy chỉnh" nhưng bên trong chỉ là **bảng cặp "tên trường / giá trị" gõ tự do** — người dùng phải
 * tự gõ cả tên trường. Base thì khác hẳn: nó bày ra **chính các trường của quy trình, xếp theo
 * từng bước**, mỗi trường đúng kiểu nhập của nó (ô chọn, ngày-giờ, bảng, tệp).
 *
 * Hai hộp phục vụ hai việc khác nhau nên **giữ cả hai**, không xóa hộp cũ: trường gõ tự do vẫn
 * cần cho thông tin phát sinh mà quy trình chưa có ô. Menu ⋯ nay có hai mục tên khác nhau rõ ràng.
 *
 * ## 🔴 KHÔNG MỞ ĐƯỜNG GHI MỚI
 * Mọi thay đổi đi qua **đúng những hàm đã có** của kho dữ liệu, vì mỗi hàm đó đang giữ luật riêng
 * của nó và tự ghi nhật ký:
 *   · `suaThongTinChung`   — tiêu đề · bộ phận · nhóm đề xuất · link phiếu
 *   · `suaThoiHan`         — ngày đề nghị cấp (**bắt ghi lý do**, xem bên dưới)
 *   · `suaMatHangDeNghi`   — bảng "Chi tiết" (tự chặn khi dòng đã có đơn hàng / đã nhận hàng)
 *   · `datSoBaoGiaChoPhieu`— SL Báo giá
 *   · `themTepGiaiDoan` + `datGhiChuTepGiaiDoan` — ba ô báo giá và ô "báo giá khác"
 * Viết một đường ghi riêng cho hộp này là bỏ qua hết những luật đó mà không có gì báo.
 *
 * ## ⚠️ MỘT CHỖ CỐ Ý KHÔNG GIỐNG BASE: đổi ngày phải ghi lý do
 * Base cho sửa "Ngày đề nghị cấp" thẳng, không hỏi gì. App thì **bắt ghi lý do** — đây là luật
 * Ban lãnh đạo đặt ra khi làm `suaThoiHan`: ngày cần hàng là **cam kết với công trình**, đổi mà
 * không nói vì sao thì bên đề nghị chỉ thấy ngày tự nhiên lùi ra và không tra được ai lùi. Vì vậy
 * ô "Lý do đổi thời hạn" chỉ hiện ra **khi ngày-giờ thật sự đổi**, và lúc đó là bắt buộc. Bỏ luật
 * này để cho giống ảnh 100% là làm mất một chốt kiểm soát đã có chủ ý.
 *
 * ## 📌 CÁC Ô BÁO GIÁ CÓ TÊN RIÊNG — SỐ Ô CHẠY THEO "SL BÁO GIÁ"
 * App vốn giữ tệp của mỗi bước thành MỘT DANH SÁCH, không có khái niệm "ô số 1, ô số 2". Để dựng
 * các ô có tên như ảnh mà không phải đổi cấu trúc dữ liệu, mỗi ô đánh dấu tệp của mình bằng **ghi
 * chú tệp** (`nhanOBaoGia`) — ghi chú vốn đã là chỗ ghi nhãn cho chứng từ. Tệp không mang nhãn nào
 * thì thuộc ô "Báo giá khác".
 *
 * 🔴 Ban lãnh đạo 18/08/2026: *"thêm 1 báo giá thì có 1 ô đính kèm, 2 báo giá thì 2 ô đính kèm. số
 * lượng ô đính kèm sẽ nhảy tự động theo số báo giá"*. Số ô đổi NGAY khi chọn ở ô "SL Báo giá",
 * không phải chờ bấm Cập nhật — người lập cần thấy đúng số ô trước khi đi xin báo giá.
 *
 * ### 🔴 BA CHỐT AN TOÀN, đụng vào là tệp biến mất khỏi màn hình
 *
 * 1. **KHÔNG BAO GIỜ ẩn một ô đang giữ tệp.** Đang có 3 báo giá đính kèm rồi hạ SL Báo giá xuống 1
 *    thì ô 2 và ô 3 phải CÒN NGUYÊN. Tệp vẫn nằm trong hồ sơ, chỉ là không còn ô nào hiện nó ra —
 *    người dùng thấy chứng từ "bốc hơi" mà không có gì báo, và không biết đường nào lấy lại. Vì
 *    vậy số ô = **max(số đang chọn, số hiệu ô cao nhất đang có tệp)**.
 * 2. **Chặn trên bằng `TOI_DA_TEP_MOI_BUOC`** (hạn mức thật của tầng dữ liệu, không phải số tự
 *    đặt ở đây). Chọn 10 báo giá mà vẽ 10 ô là hứa 10 chỗ trong khi hàm ghi chỉ nhận 5 — người
 *    dùng chọn tệp thứ 6 mới bị từ chối. Vẽ đúng số ô nhận được, và **nói ra** vì sao bị chặn.
 * 3. **Tệp mang nhãn vượt quá số ô đang vẽ thì rơi vào ô "Báo giá khác"**, không bị lọc mất. Không
 *    có chốt này thì một tệp nhãn "Báo giá NCC 7" (do hồ sơ cũ, hoặc do hạn mức bị hạ) không hiện
 *    ở đâu cả — vừa không có ô số 7, vừa bị coi là "đã có nhãn" nên ô "khác" cũng bỏ qua.
 *
 * ⚠️ Hạ SL Báo giá **không xóa tệp nào**. Muốn bỏ chứng từ thì gỡ ở khối đính kèm ngoài trang chi
 * tiết, nơi có hộp hỏi xác nhận — gỡ chứng từ khỏi hồ sơ không hoàn lại được.
 *
 * ⚠️ Người dùng tự sửa ghi chú của một tệp ở khối đính kèm ngoài trang chi tiết thì tệp đó chuyển
 * ô. Không mất dữ liệu, chỉ đổi chỗ hiển thị.
 */

/** Nhãn ghi chú đánh dấu ô báo giá thứ `i` (đếm từ 0) — xem khối chú thích đầu file. */
function nhanOBaoGia(i: number): string {
  return `Báo giá NCC ${i + 1}`;
}

/**
 * Đọc số hiệu ô từ ghi chú tệp. Trả `0` khi ghi chú không phải nhãn ô nào.
 *
 * ⚠️ Phải khớp CHÍNH XÁC dạng `nhanOBaoGia` sinh ra. Nới lỏng thành "có chứa chữ báo giá" là ghi
 * chú người dùng tự gõ (*"báo giá bên A rẻ hơn"*) bị hiểu thành nhãn ô, tệp nhảy sang chỗ khác.
 */
function chiSoOBaoGia(ghiChu: string | undefined): number {
  const khop = (ghiChu ?? "").trim().match(/^Báo giá NCC (\d+)$/);
  return khop ? Number(khop[1]) : 0;
}

/** Bước giữ tệp báo giá nhà cung cấp. */
const BUOC_BAO_GIA = "xet_duyet_bao_gia";

/**
 * ★ Ô CHỌN "SL BÁO GIÁ" — đúng bốn mục **1 · 2 · 3 · Nhiều** như ảnh Base (18/08/2026).
 *
 * 🔴 "NHIỀU" KHÔNG PHẢI MỘT CON SỐ, mà dữ liệu app thì là số (`DongDeNghi.soBaoGiaYeuCau`). Nên
 * phải quy ước, và quy ước đó chia làm HAI việc khác nhau — đừng gộp:
 *
 *  · **Số ghi vào hồ sơ = 4** (`SO_BAO_GIA_NHIEU`), tức mức thấp nhất của khoảng "nhiều".
 *    Con số này là YÊU CẦU GIAO CHO NGƯỜI KHÁC: ghi 5 cho "gọn" là bắt nhân viên đi lấy thêm một
 *    bản báo giá mà trưởng bộ phận không hề yêu cầu, và nhật ký hồ sơ sẽ ghi con số không ai đặt.
 *
 *  · **Số ô đính kèm = mở HẾT hạn mức của một bước.** "Nhiều" là khoảng mở, không biết chính xác
 *    mấy bản, nên cho sẵn nhiều chỗ. Ô chứa rộng hơn thì không hại ai; ngược lại thiếu ô là người
 *    lập phải dồn chứng từ vào ô "Báo giá khác".
 *
 * 🔴 CHỐT CHỐNG GHI ĐÈ SỐ CŨ: hồ sơ lập trước đây có thể đang giữ 7 hay 8 báo giá — những số không
 * còn trong danh sách. Ô chọn hiện "Nhiều" cho các số ≥ 4, và nếu người dùng KHÔNG đổi mục thì
 * `capNhat` **không ghi gì**, nên con số 7 giữ nguyên. Không có chốt này thì chỉ cần mở hộp ra bấm
 * Cập nhật là 7 âm thầm tụt xuống 4.
 */
const MA_NHIEU = "nhieu";
/** Số ghi vào hồ sơ khi chọn "Nhiều" — xem lý do ở khối chú thích ngay trên. */
const SO_BAO_GIA_NHIEU = 4;

/** Dòng bảng "Chi tiết" ở dạng chuỗi thô đang gõ — đổi sang số lúc lưu. */
interface DongGo {
  stt: number;
  tenVatLieu: string;
  quyCach: string;
  khoiLuong: string;
  donViTinh: string;
  mucDichSuDung: string;
  /** Giữ nguyên phần dữ liệu KHÔNG hiện trên bảng này (phân bổ, ghi chú, cờ định mức). */
  goc?: DongDeNghi;
}

export function HopSuaTruongTuyChinh({
  mo,
  deNghi,
  onDong,
}: {
  mo: boolean;
  deNghi: DeNghiMuaHang;
  onDong: () => void;
}) {
  const {
    suaThongTinChung,
    suaThoiHan,
    suaMatHangDeNghi,
    datSoBaoGiaChoPhieu,
    themTepGiaiDoan,
    datTepVaoOGiaiDoan,
  } = useDuLieu();
  const { nguoiDung } = useNguoiDung();

  const [tieuDe, setTieuDe] = useState("");
  const [phongBan, setPhongBan] = useState("");
  const [nhomDeXuat, setNhomDeXuat] = useState<NhomDeXuat>("khac");
  const [ngay, setNgay] = useState("");
  const [gio, setGio] = useState("");
  const [lyDoDoiHan, setLyDoDoiHan] = useState("");
  const [link, setLink] = useState("");
  const [dong, setDong] = useState<DongGo[]>([]);
  const [soBaoGia, setSoBaoGia] = useState("");
  /** Nhóm nào đang mở. Mặc định mở nhóm đầu — đó là nhóm người dùng sửa nhiều nhất. */
  const [nhomMo, setNhomMo] = useState<string[]>(["nhap_moi"]);

  /**
   * Nạp lại toàn bộ giá trị THẬT của hồ sơ mỗi lần mở hộp.
   * ⚠️ Mở → sửa dở → Bỏ qua → mở lại phải thấy giá trị của hồ sơ, không phải chữ gõ dở lần trước.
   */
  useEffect(() => {
    if (!mo) return;
    setTieuDe(deNghi.tieuDe);
    setPhongBan(deNghi.phongBanNguon);
    setNhomDeXuat(deNghi.nhomDeXuat ?? "khac");
    /* `ngayCanHang` có thể là "2026-08-27" hoặc ISO đầy đủ "2026-08-27T16:25" — tách làm hai ô
       như Base. Ô ngày của trình duyệt chỉ nhận đúng 10 ký tự đầu, đưa cả chuỗi ISO vào là ô
       hiện TRỐNG mà không báo gì. */
    setNgay(deNghi.ngayCanHang.slice(0, 10));
    setGio(deNghi.ngayCanHang.includes("T") ? deNghi.ngayCanHang.slice(11, 16) : "");
    setLyDoDoiHan("");
    setLink(deNghi.linkPhieuDeNghi ?? "");
    setDong(
      deNghi.items.map((d) => ({
        stt: d.stt,
        tenVatLieu: d.tenVatLieu,
        quyCach: d.quyCach ?? "",
        khoiLuong: String(d.khoiLuongDeNghi),
        donViTinh: d.donViTinh,
        mucDichSuDung: d.mucDichSuDung ?? "",
        goc: d,
      })),
    );
    /* SL Báo giá: lấy số CHUNG của mọi dòng đã giao. Mỗi dòng một số thì để trống ô chọn — đặt
       lại ở đây sẽ ghi đè số riêng của từng dòng, đúng cái bẫy đã ghi trong `o-sua-so-bao-gia`. */
    const so = deNghi.items
      .map((d) => d.soBaoGiaYeuCau)
      .filter((x): x is number => typeof x === "number" && x > 0);
    const chung = so.length > 0 && Math.min(...so) === Math.max(...so) ? so[0] : undefined;
    /* Số ≥ 4 (kể cả 7, 8 của hồ sơ cũ) đều hiện là "Nhiều" — danh sách chỉ còn 1/2/3/Nhiều.
       Xem chốt chống ghi đè ở khối chú thích của `MA_NHIEU`. */
    setSoBaoGia(
      chung === undefined ? "" : chung >= SO_BAO_GIA_NHIEU ? MA_NHIEU : String(chung),
    );
  }, [mo, deNghi]);

  /** Tệp của bước ③, tra theo nhãn ghi chú. */
  const tepBuocBaoGia: MoTaTep[] = deNghi.tepGiaiDoan?.[BUOC_BAO_GIA] ?? [];

  /* ---------- SỐ Ô ĐÍNH KÈM CHẠY THEO "SL BÁO GIÁ" (xem ba chốt ở đầu file) ---------- */

  /**
   * Số ô cần mở theo ô "SL Báo giá". `0` khi chưa đặt hoặc mỗi dòng một số.
   * "Nhiều" thì mở HẾT hạn mức — xem khối chú thích của `MA_NHIEU`.
   */
  const soChon = soBaoGia === MA_NHIEU ? TOI_DA_TEP_MOI_BUOC : Number(soBaoGia) || 0;
  /** Số hiệu ô CAO NHẤT đang giữ tệp — chốt 1: hạ SL Báo giá không được ẩn mất tệp. */
  const soODaCoTep = tepBuocBaoGia.reduce((max, t) => Math.max(max, chiSoOBaoGia(t.ghiChu)), 0);
  /** Số ô thật sự vẽ ra. Chốt 2: không vượt hạn mức tệp mỗi bước của tầng dữ liệu. */
  const soO = Math.min(Math.max(soChon, soODaCoTep), TOI_DA_TEP_MOI_BUOC);
  /**
   * Đang bị hạn mức chặn — phải nói ra, đừng để người dùng tự đoán vì sao thiếu ô.
   * ⚠️ So trên `soODaCoTep` nữa, không chỉ số đang chọn: hồ sơ cũ có thể giữ tệp mang nhãn
   * "Báo giá NCC 8" (từ thời ô chọn còn cho tới 10), lúc đó thiếu ô số 8 mà không có gì giải thích.
   */
  const biChanBoiHanMuc = Math.max(soChon, soODaCoTep) > TOI_DA_TEP_MOI_BUOC;

  const tepTheoO = Array.from({ length: soO }, (_, i) =>
    tepBuocBaoGia.find((t) => chiSoOBaoGia(t.ghiChu) === i + 1),
  );
  /* Chốt 3: tệp không có nhãn ô, HOẶC mang nhãn vượt quá số ô đang vẽ, đều rơi vào "Báo giá khác".
     Nhờ vậy mọi tệp trong hồ sơ luôn hiện ở đúng một chỗ, không tệp nào vô hình. */
  const tepKhac = tepBuocBaoGia.filter((t) => {
    const chiSo = chiSoOBaoGia(t.ghiChu);
    return chiSo === 0 || chiSo > soO;
  });

  /**
   * Hạn mức còn lại cho ô "Báo giá khác".
   *
   * `ODinhKemNhieuTep` tính số nhận thêm = `toiDa - tep.length`, nên phải trừ sẵn phần các ô có tên
   * đang chiếm — cả bước dùng CHUNG một hạn mức. Không trừ thì ô này mời chọn 5 tệp trong khi tầng
   * dữ liệu từ chối ngay tệp đầu, và người dùng chỉ thấy một thông báo lỗi không hiểu vì sao.
   * `Math.max` với số tệp hiện có: không bao giờ truyền hạn mức nhỏ hơn danh sách đang giữ.
   */
  const soTepTrongOCoTen = tepTheoO.filter(Boolean).length;
  const hanMucOKhac = Math.max(tepKhac.length, TOI_DA_TEP_MOI_BUOC - soTepTrongOCoTen);

  const ngayGioMoi = ngay === "" ? "" : gio === "" ? ngay : `${ngay}T${gio}`;
  const doiNgayGio = ngayGioMoi !== "" && ngayGioMoi !== deNghi.ngayCanHang;

  const hopLe =
    tieuDe.trim() !== "" &&
    ngay !== "" &&
    dong.length > 0 &&
    // Đổi ngày thì bắt ghi lý do — xem khối chú thích đầu file.
    (!doiNgayGio || lyDoDoiHan.trim() !== "");

  function suaDong(i: number, phan: Partial<DongGo>) {
    setDong((t) => t.map((x, k) => (k === i ? { ...x, ...phan } : x)));
  }

  /**
   * Đính kèm vào MỘT Ô CÓ TÊN — MỘT LẦN GHI DUY NHẤT.
   *
   * 🔴 SỬA 20/08/2026. Bản cũ gọi `themTepGiaiDoan` rồi gọi tiếp `datGhiChuTepGiaiDoan`, và
   * **nhãn không bao giờ được ghi**: hàm thứ hai đọc `deNghiRef.current`, mà ref chỉ cập nhật
   * lúc render nên nó không thấy tệp vừa thêm, trả *"Tệp này không còn trong hồ sơ"* rồi thôi.
   * Chú thích cũ ở đây tự tin là đã xử lý đúng ("phải chờ hàm thứ nhất xong") — nhưng "xong" ở
   * đây chỉ là **xếp lịch `setState`**, không phải state đã đổi. Xem `datTepVaoOGiaiDoan`.
   *
   * Hàm mới cũng tự GỠ bản cũ khi ô đã có tệp, nên nút "Thay tệp" nay thay thật thay vì thêm
   * một tệp thứ hai cùng nhãn rồi bản mới thành vô hình.
   */
  function ganTepVaoO(tep: MoTaTep, nhan: string): string | null {
    return datTepVaoOGiaiDoan(deNghi.id, BUOC_BAO_GIA, tep, nhan, nguoiDung.tenHienThi);
  }

  function capNhat() {
    /* 🔴 GỌI TỪNG HÀM RIÊNG, mỗi hàm chỉ khi trường của nó THẬT SỰ đổi. Gọi hết mọi lần bấm là
       nhật ký hồ sơ đầy dòng "đã sửa" mà chẳng sửa gì — mỗi hàm đều tự ghi một dòng. */
    const doiThongTin =
      tieuDe.trim() !== deNghi.tieuDe ||
      phongBan !== deNghi.phongBanNguon ||
      nhomDeXuat !== (deNghi.nhomDeXuat ?? "khac") ||
      link.trim() !== (deNghi.linkPhieuDeNghi ?? "");
    if (doiThongTin) {
      suaThongTinChung(
        deNghi.id,
        {
          tieuDe: tieuDe.trim(),
          phongBanNguon: phongBan,
          nhomDeXuat,
          linkPhieuDeNghi: link.trim(),
        },
        nguoiDung.tenHienThi,
      );
    }

    if (doiNgayGio) suaThoiHan(deNghi.id, ngayGioMoi, lyDoDoiHan.trim(), nguoiDung.tenHienThi);

    /* Bảng "Chi tiết": dựng lại danh sách dòng, GIỮ nguyên phần dữ liệu không hiện trên bảng
       (người phụ trách, số báo giá yêu cầu, ghi chú giao việc). Bỏ qua chúng là mỗi lần sửa tên
       một mặt hàng lại xóa sạch việc đã giao. */
    const dongMoi: DongDeNghi[] = dong.map((d, i) => ({
      ...(d.goc ?? { stt: i + 1, tenVatLieu: "", donViTinh: "", khoiLuongDeNghi: 0 }),
      stt: d.goc?.stt ?? i + 1,
      tenVatLieu: d.tenVatLieu.trim(),
      quyCach: d.quyCach.trim() || undefined,
      donViTinh: d.donViTinh.trim(),
      khoiLuongDeNghi: Number(d.khoiLuong) || 0,
      mucDichSuDung: d.mucDichSuDung.trim() || undefined,
    }));
    const doiDong = JSON.stringify(dongMoi) !== JSON.stringify(deNghi.items);
    if (doiDong) {
      const loi = suaMatHangDeNghi(deNghi.id, dongMoi, nguoiDung.tenHienThi);
      if (loi) {
        // 🔴 KHÔNG ĐÓNG HỘP khi tầng dữ liệu từ chối: đóng là người dùng tưởng đã lưu xong.
        toast.error("Không sửa được danh sách mặt hàng", { description: loi });
        return;
      }
    }

    /* ---------- SL BÁO GIÁ ----------
       🔴 CHỐT CHỐNG GHI ĐÈ SỐ CŨ. Hồ sơ lập trước đây có thể đang giữ 7 hay 8 báo giá — những số
       không còn trong danh sách, nên ô chọn hiện "Nhiều". Nếu người dùng KHÔNG đổi mục thì không
       được ghi gì: thiếu chốt này, chỉ cần mở hộp ra bấm Cập nhật là 7 âm thầm tụt xuống 4, mà
       nhật ký sẽ ghi như thể trưởng bộ phận vừa hạ yêu cầu. */
    const soCu = dong[0]?.goc?.soBaoGiaYeuCau;
    const dangLaNhieu = soBaoGia === MA_NHIEU;
    const soMoi = dangLaNhieu ? SO_BAO_GIA_NHIEU : Number(soBaoGia);
    const giuNguyenNhieu = dangLaNhieu && typeof soCu === "number" && soCu >= SO_BAO_GIA_NHIEU;
    if (soBaoGia !== "" && soMoi > 0 && soMoi !== soCu && !giuNguyenNhieu) {
      datSoBaoGiaChoPhieu(deNghi.id, soMoi, nguoiDung.tenHienThi);
    }

    toast.success("Đã cập nhật các trường dữ liệu");
    onDong();
  }

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      {/* 🔴 PHẢI VIẾT `sm:max-w-…`: `DialogContent` có sẵn `sm:max-w-sm` trong lớp gốc, class
          không có tiền tố `sm:` bị đè IM LẶNG và hộp kẹt ở 384px (bài học 15/08/2026, CLAUDE.md
          mục 5). Hộp này có bảng 6 cột nên cần rộng.
          `max-h` + cuộn DỌC: nội dung dài hơn màn hình thì cuộn trong hộp, không đẩy nút
          "Cập nhật" ra khỏi tầm mắt. */}
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa các trường dữ liệu tùy chỉnh</DialogTitle>
          <DialogDescription>
            {deNghi.code} — mọi thay đổi được ghi vào nhật ký kèm giá trị cũ và người sửa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-(--hp-md-card-gap) overflow-y-auto">
          {/* ---------- TÊN NHIỆM VỤ: đứng ngoài mọi nhóm, đúng như Base ---------- */}
          <Truong nhan="Tên nhiệm vụ" batBuoc id="tc-tieu-de">
            <Input
              id="tc-tieu-de"
              value={tieuDe}
              onChange={(e) => setTieuDe(e.target.value)}
              placeholder="Vật tư thi công phần thân đợt 4"
            />
          </Truong>

          {/* ---------- NHÓM ①: TRƯỜNG DỮ LIỆU KHI NHẬP MỚI ---------- */}
          <Nhom
            ma="nhap_moi"
            nhan="Trường dữ liệu khi nhập mới"
            mo={nhomMo.includes("nhap_moi")}
            onBam={() =>
              setNhomMo((c) =>
                c.includes("nhap_moi") ? c.filter((x) => x !== "nhap_moi") : [...c, "nhap_moi"],
              )
            }
          >
            <Truong
              nhan="Bộ phận"
              batBuoc
              moTa="Bạn thuộc phòng ban hay bộ phận nào?"
              id="tc-bo-phan"
            >
              <OChon id="tc-bo-phan" value={phongBan} onChange={setPhongBan}>
                {DANH_MUC_PHONG_BAN.map((p) => (
                  <option key={p.ma} value={p.ma}>
                    {p.ten}
                  </option>
                ))}
              </OChon>
            </Truong>

            <Truong nhan="Nhóm đề xuất" batBuoc id="tc-nhom">
              <OChon
                id="tc-nhom"
                value={nhomDeXuat}
                onChange={(v) => setNhomDeXuat(v as NhomDeXuat)}
              >
                {(Object.keys(NHAN_NHOM_DE_XUAT) as NhomDeXuat[]).map((k) => (
                  <option key={k} value={k}>
                    {NHAN_NHOM_DE_XUAT[k]}
                  </option>
                ))}
              </OChon>
            </Truong>

            <Truong
              nhan="Ngày đề nghị cấp"
              batBuoc
              moTa="Ghi rõ ngày-giờ đề nghị cấp"
              id="tc-ngay"
            >
              <div className="flex flex-wrap gap-2">
                <Input
                  id="tc-ngay"
                  type="date"
                  value={ngay}
                  onChange={(e) => setNgay(e.target.value)}
                  className="w-40"
                />
                <Input
                  type="time"
                  value={gio}
                  onChange={(e) => setGio(e.target.value)}
                  aria-label="Giờ đề nghị cấp"
                  className="w-28"
                />
              </div>
            </Truong>

            {/* ⚠️ CHỈ HIỆN KHI NGÀY-GIỜ ĐỔI — xem khối chú thích đầu file. Hiện sẵn thì người
                chỉ vào sửa tiêu đề cũng thấy một ô bắt buộc không liên quan. */}
            {doiNgayGio && (
              <Truong nhan="Lý do đổi thời hạn" batBuoc id="tc-ly-do">
                <Input
                  id="tc-ly-do"
                  value={lyDoDoiHan}
                  onChange={(e) => setLyDoDoiHan(e.target.value)}
                  placeholder="Công trình lùi tiến độ đổ sàn tầng 3"
                />
                <span className="text-xs text-text-desc">
                  Bắt buộc — ngày cần hàng là cam kết với công trình, đổi phải nói rõ vì sao.
                </span>
              </Truong>
            )}

            {/* ---------- BẢNG "CHI TIẾT" ---------- */}
            <Truong nhan="Chi tiết" batBuoc>
              {/* Bảng 6 cột trên màn hẹp thì CUỘN TRONG KHUNG, không bóp cột đến mức không gõ
                  được. `overflow-x-auto` phải bọc riêng bảng, không bọc cả hộp. */}
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[42rem] border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted text-left text-[11px] font-semibold tracking-wide text-text-desc uppercase">
                      <th className="w-10 px-2 py-2">#</th>
                      <th className="px-2 py-2">Tên mặt hàng</th>
                      <th className="px-2 py-2">Quy cách</th>
                      <th className="w-24 px-2 py-2">Số lượng</th>
                      <th className="w-20 px-2 py-2">ĐVT</th>
                      <th className="px-2 py-2">Mục đích sử dụng</th>
                      <th className="w-11 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {dong.map((d, i) => (
                      <tr key={d.goc?.stt ?? `moi-${i}`} className="border-t border-border">
                        <td className="px-2 py-1.5 text-center text-xs text-text-desc tabular-nums">
                          {i + 1}
                        </td>
                        <td className="px-2 py-1.5">
                          <OGoTrongBang
                            value={d.tenVatLieu}
                            onChange={(v) => suaDong(i, { tenVatLieu: v })}
                            nhan={`Tên mặt hàng dòng ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <OGoTrongBang
                            value={d.quyCach}
                            onChange={(v) => suaDong(i, { quyCach: v })}
                            nhan={`Quy cách dòng ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <OGoTrongBang
                            value={d.khoiLuong}
                            onChange={(v) => suaDong(i, { khoiLuong: v })}
                            nhan={`Số lượng dòng ${i + 1}`}
                            soLuong
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <OGoTrongBang
                            value={d.donViTinh}
                            onChange={(v) => suaDong(i, { donViTinh: v })}
                            nhan={`Đơn vị tính dòng ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <OGoTrongBang
                            value={d.mucDichSuDung}
                            onChange={(v) => suaDong(i, { mucDichSuDung: v })}
                            nhan={`Mục đích sử dụng dòng ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          {/* 🔴 `size-11` = 44×44 theo Design System V1.1, KHÔNG thu nhỏ cho
                              "gọn". Đo được bản trước chỉ 36px — mà đây là nút XÓA DÒNG, bấm
                              trượt trên máy tính bảng là mất một mặt hàng. Cùng nếp đã ghi ở
                              `o-sua-so-bao-gia.tsx`: giảm phần NHÌN THẤY thì được, giảm phần bấm
                              được thì không. */}
                          <button
                            type="button"
                            onClick={() => setDong((x) => x.filter((_, k) => k !== i))}
                            aria-label={`Xóa dòng ${i + 1}`}
                            title="Xóa dòng"
                            className="flex size-11 items-center justify-center rounded-md text-text-desc transition-colors hover:bg-muted hover:text-danger"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() =>
                  setDong((t) => [
                    ...t,
                    {
                      // STT mới nối tiếp số lớn nhất đang có — KHÔNG dùng `length + 1`: xóa dòng
                      // giữa rồi thêm mới sẽ ra STT trùng, mà STT là khóa đối chiếu khối lượng
                      // của dòng đơn hàng và dòng nhận hàng.
                      stt: Math.max(0, ...t.map((x) => x.stt)) + 1,
                      tenVatLieu: "",
                      quyCach: "",
                      khoiLuong: "",
                      donViTinh: "",
                      mucDichSuDung: "",
                    },
                  ])
                }
              >
                <Plus className="size-4" aria-hidden />
                Thêm dòng mới
              </Button>
            </Truong>

            <Truong nhan="Link phiếu đề nghị" id="tc-link">
              <Input
                id="tc-link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://… hoặc đường dẫn thư mục chung của phòng"
              />
            </Truong>
          </Nhom>

          {/* ---------- NHÓM ②: YÊU CẦU NCC BÁO GIÁ ---------- */}
          <Nhom
            ma="bao_gia"
            nhan={NHAN_GIAI_DOAN.yeu_cau_bao_gia.nhan}
            mo={nhomMo.includes("bao_gia")}
            onBam={() =>
              setNhomMo((c) =>
                c.includes("bao_gia") ? c.filter((x) => x !== "bao_gia") : [...c, "bao_gia"],
              )
            }
          >
            <Truong nhan="SL Báo giá" batBuoc id="tc-sl-bao-gia">
              {/* Đúng bốn mục 1 · 2 · 3 · Nhiều như ảnh Base. Mục "— chưa đặt —" là của app, ảnh
                  Base không có: dữ liệu app cho phép CHƯA ĐẶT, bỏ mục này thì mở hộp ra ô hiện
                  "1" trong khi thực tế chưa ai đặt — âm thầm sai. */}
              <OChon id="tc-sl-bao-gia" value={soBaoGia} onChange={setSoBaoGia}>
                <option value="">— chưa đặt —</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value={MA_NHIEU}>Nhiều</option>
              </OChon>
              <span className="text-xs text-text-desc">
                Đặt ở đây là áp cho <strong>mọi dòng</strong> của phiếu. Muốn mỗi dòng một số khác
                nhau thì đặt lúc giao việc ở bảng Phân bổ.
                {soBaoGia === MA_NHIEU && (
                  <>
                    {" "}
                    “Nhiều” ghi vào hồ sơ là <strong>từ {SO_BAO_GIA_NHIEU} báo giá</strong>, và mở
                    sẵn {TOI_DA_TEP_MOI_BUOC} ô đính kèm.
                  </>
                )}
              </span>
            </Truong>
          </Nhom>

          {/* ---------- NHÓM ③: XÉT DUYỆT BÁO GIÁ ---------- */}
          <Nhom
            ma="xet_duyet"
            nhan={NHAN_GIAI_DOAN.xet_duyet_bao_gia.nhan}
            mo={nhomMo.includes("xet_duyet")}
            onBam={() =>
              setNhomMo((c) =>
                c.includes("xet_duyet") ? c.filter((x) => x !== "xet_duyet") : [...c, "xet_duyet"],
              )
            }
          >
            {/* Số ô bằng đúng SL Báo giá đang chọn — xem ba chốt an toàn ở đầu file. */}
            {tepTheoO.map((tep, i) => (
              <Truong key={nhanOBaoGia(i)} nhan={`${nhanOBaoGia(i)} (PDF)`}>
                <ODinhKemTep
                  tep={tep}
                  nhanThem="Chọn tệp"
                  nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
                  onXong={(t) => ganTepVaoO(t, nhanOBaoGia(i))}
                />
              </Truong>
            ))}

            {/* Chưa đặt SL Báo giá thì KHÔNG bịa ra ô nào — nói thẳng là chưa biết cần mấy ô, và
                chỉ đường sang chỗ đặt. Vẽ sẵn một ô là đoán hộ người dùng. */}
            {soO === 0 && (
              <p className="text-xs text-text-desc">
                Chọn <strong>SL Báo giá</strong> ở bước “{NHAN_GIAI_DOAN.yeu_cau_bao_gia.nhan}” để mở
                đúng số ô đính kèm. Chưa đặt thì cứ bỏ tệp vào ô “Báo giá khác” bên dưới.
              </p>
            )}

            {/* Bị hạn mức chặn thì PHẢI nói ra — thiếu ô mà im lặng là người dùng tưởng app lỗi. */}
            {biChanBoiHanMuc && (
              <p className="text-xs text-text-desc">
                Hồ sơ này cần tới <strong>{Math.max(soChon, soODaCoTep)}</strong> ô, nhưng mỗi bước
                chỉ giữ được <strong>{TOI_DA_TEP_MOI_BUOC}</strong> tệp nên chỉ mở{" "}
                {TOI_DA_TEP_MOI_BUOC} ô. Các báo giá còn lại nằm ở ô “Báo giá khác”.
              </p>
            )}

            <Truong
              nhan="Báo giá khác (PDF)"
              moTa="Upload các báo giá còn lại theo thứ tự ưu tiên"
            >
              <ODinhKemNhieuTep
                tep={tepKhac}
                nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
                nhan="Chọn tệp"
                toiDa={hanMucOKhac}
                onDoi={(moi) => {
                  /* Chỉ xử lý phần THÊM. Việc gỡ tệp đi qua khối đính kèm ở trang chi tiết —
                     nơi có hộp hỏi xác nhận, vì gỡ chứng từ khỏi hồ sơ không hoàn lại được. */
                  const themVao = moi.filter((t) => !tepKhac.some((c) => c.id === t.id));
                  for (const t of themVao) {
                    const loi = themTepGiaiDoan(
                      deNghi.id,
                      BUOC_BAO_GIA,
                      [t],
                      nguoiDung.tenHienThi,
                    );
                    if (loi) toast.error("Không lưu được tệp vào hồ sơ", { description: loi });
                  }
                }}
              />
            </Truong>
          </Nhom>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Bỏ qua
          </Button>
          <Button disabled={!hopLe} onClick={capNhat}>
            Cập nhật
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// CÁC MẢNH NHỎ CỦA HỘP
// ------------------------------------------------------------

/**
 * Một nhóm gập được.
 *
 * 📌 Dùng đúng kiểu chữ và màu của khối bước ở trang chi tiết
 * (`khoi-dau-vao-theo-giai-doan.tsx`): hai chỗ cùng nói về một bước quy trình, nhìn khác nhau là
 * người dùng phải học hai lần.
 */
function Nhom({
  ma,
  nhan,
  mo,
  onBam,
  children,
}: {
  ma: string;
  nhan: string;
  mo: boolean;
  onBam: () => void;
  children: React.ReactNode;
}) {
  /**
   * 🔴 `shrink-0` LÀ BẮT BUỘC, KHÔNG PHẢI TRANG TRÍ — Ban lãnh đạo báo *"lỗi hiển thị"* ngày
   * 18/08/2026: nhóm đầu tiên bị **cắt ngang đáy**, dòng "Link phiếu đề nghị" chỉ hiện một nửa,
   * mà hộp thoại thì không cuộn xuống được phần bị mất.
   *
   * CƠ CHẾ (đủ hai điều kiện mới sinh lỗi, thiếu một cái là không thấy gì):
   *  ① Thân hộp là flex column **có chặn chiều cao** (`max-h-[90vh]` trên `DialogContent`), nên
   *     con của nó bị co lại theo `flex-shrink: 1` mặc định.
   *  ② Bình thường `min-height: auto` của flex item sẽ chặn không cho co nhỏ hơn nội dung — NHƯNG
   *     quy tắc đó **không áp dụng cho phần tử là khung cuộn**. `overflow-hidden` (thêm vào để bo
   *     góc cho gọn) biến `<section>` thành khung cuộn, nên mức co tối thiểu tụt về 0: section co
   *     tự do, và chính `overflow-hidden` xóa luôn phần thừa ra.
   *
   * Đo được trước khi sửa: nhóm 1 cần 679px mà chỉ được 481px (mất 198px); thân hộp có
   * `scrollHeight === clientHeight` nên **không cuộn được gì** — nội dung không tràn, nó bị co.
   * Hai nhóm đang gập cũng bị nén còn 31px trong khi nút tiêu đề khai `min-h-11` = 44px, tức
   * vùng chạm tối thiểu của Design System V1.1 cũng bị phá theo mà nhìn không ra.
   *
   * ⚠️ ĐỪNG "sửa" bằng cách bỏ `overflow-hidden`: bỏ nó thì nền xanh của dòng tiêu đề tràn ra
   * ngoài góc bo. Giữ cả hai, chỉ tắt co.
   */
  return (
    <section className="shrink-0 overflow-hidden rounded-xl border border-primary/30">
      <button
        type="button"
        onClick={onBam}
        aria-expanded={mo}
        aria-controls={`nhom-${ma}`}
        className="flex min-h-11 w-full items-center gap-2 bg-primary-bg px-3 py-2.5 text-left transition-colors hover:bg-primary/10"
      >
        <ChevronRight
          className={`size-4 shrink-0 text-primary transition-transform ${mo ? "rotate-90" : ""}`}
          aria-hidden
        />
        <span className="text-[11px] font-semibold tracking-wide text-primary uppercase">
          {nhan}
        </span>
      </button>
      {mo && (
        <div id={`nhom-${ma}`} className="flex flex-col gap-(--hp-md-card-gap) p-3">
          {/* Nhãn "ĐẦU VÀO" y như trên trang chi tiết — cùng một thứ thì gọi cùng một tên. */}
          <p className="flex items-center gap-1.5 text-xs font-semibold text-text-desc uppercase">
            <LogIn className="size-3.5 shrink-0" aria-hidden />
            Đầu vào
          </p>
          {children}
        </div>
      )}
    </section>
  );
}

/** Một trường: nhãn (kèm dấu * nếu bắt buộc) · mô tả phụ · ô nhập. */
function Truong({
  nhan,
  moTa,
  batBuoc = false,
  id,
  children,
}: {
  nhan: string;
  moTa?: string;
  batBuoc?: boolean;
  id?: string;
  children: React.ReactNode;
}) {
  /**
   * 🔴 BỐ CỤC NHÃN BÊN TRÁI — Ô NHẬP BÊN PHẢI, Ban lãnh đạo 18/08/2026: *"hãy bố cục nó giống
   * vậy"* (ảnh Base: nhãn "SL Báo giá *" nằm cùng hàng với ô chọn, không phải nhãn trên ô dưới).
   *
   * 📌 Nhãn cột trái `sm:w-1/3`, ô nhập chiếm phần còn lại — đúng tỉ lệ đọc được từ ảnh.
   *
   * 🔴 `min-w-0` ở cột phải là BẮT BUỘC, không phải cho đẹp: bảng "Chi tiết" nằm trong cột này và
   * dựa vào `overflow-x-auto` để cuộn. Mặc định ô flex không co nhỏ hơn nội dung, thiếu `min-w-0`
   * là bảng 6 cột đẩy giãn cả hộp thoại thay vì cuộn bên trong.
   *
   * ⚠️ CHỈ xếp hai cột từ `sm:` trở lên. Màn 375px chia đôi thì nhãn *"Mục đích sử dụng"* và ô nhập
   * đều còn vài chục pixel — điện thoại giữ nguyên nhãn trên, ô dưới.
   *
   * `shrink-0` cùng lý do như ở `Nhom`: trường nào cũng là con của một flex column có thể bị chặn
   * chiều cao, thiếu nó thì ô nhập bị nén dẹt mà không có gì báo.
   */
  return (
    <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-4">
      {/* `sm:pt-2.5` kéo nhãn xuống cho thẳng hàng chữ với ô nhập cao 44px bên cạnh. */}
      <div className="sm:w-1/3 sm:shrink-0 sm:pt-2.5">
        <Label htmlFor={id}>
          {nhan}
          {/* Dấu * có `aria-hidden` và kèm chữ cho trình đọc màn hình: chỉ dùng dấu sao thì người
              dùng trình đọc không biết trường nào bắt buộc. */}
          {batBuoc && (
            <>
              <span aria-hidden className="text-danger">
                {" *"}
              </span>
              <span className="sr-only"> (bắt buộc)</span>
            </>
          )}
        </Label>
        {moTa && <p className="mt-0.5 text-xs text-text-desc">{moTa}</p>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">{children}</div>
    </div>
  );
}

/**
 * Ô chọn.
 *
 * 🔴 DÙNG `<select>` GỐC CỦA TRÌNH DUYỆT, không dùng `Select` của base-ui: `Select` mở danh sách
 * bằng một lớp nổi riêng, mà hộp thoại này cũng là một lớp nổi có bẫy tiêu điểm — trong app chưa
 * có chỗ nào ghép hai thứ đó nên chưa có gì bảo đảm nó mở được. Ô chọn gốc thì chắc chắn chạy,
 * và trên điện thoại còn hiện bộ chọn của hệ điều hành, dễ bấm hơn.
 * 📌 Đã tô đúng token nền/viền/chữ như `Input` để không lệch khỏi Design System.
 */
function OChon({
  id,
  value,
  onChange,
  children,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors hover:border-primary focus:border-primary focus:outline-none"
    >
      {children}
    </select>
  );
}

/**
 * Ô gõ trong bảng "Chi tiết" — viền mảnh, không nền, để bảng đọc như bảng chứ không như một dãy
 * hộp nhập.
 *
 * 🔴 `min-h-11` = 44px, KHÔNG phải `min-h-9`. Bản đầu để `min-h-9`, đo ra chỉ **34px** cao thật —
 * dưới ngưỡng 44×44 của Design System V1.1. Sáu cột gõ tay trên máy tính bảng mà ô cao 34px là
 * bấm vào ô bên cạnh.
 *
 * 📌 Cao 44px nhưng KHÔNG dày lên về mặt thị giác: viền trong suốt, không nền, nên bảng vẫn đọc
 * ra bảng. Đúng nếp *"giảm phần nhìn thấy thì được, giảm phần bấm được thì không"*.
 */
function OGoTrongBang({
  value,
  onChange,
  nhan,
  soLuong = false,
}: {
  value: string;
  onChange: (v: string) => void;
  nhan: string;
  soLuong?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={nhan}
      inputMode={soLuong ? "decimal" : undefined}
      className={`min-h-11 w-full rounded-md border border-transparent bg-transparent px-1.5 text-sm text-text-primary transition-colors hover:border-border focus:border-primary focus:outline-none ${
        soLuong ? "text-right tabular-nums" : ""
      }`}
    />
  );
}
