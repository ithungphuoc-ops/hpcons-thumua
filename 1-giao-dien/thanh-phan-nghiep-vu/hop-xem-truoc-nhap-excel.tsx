"use client";

import { AlertTriangle, Check, FileSpreadsheet } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/1-giao-dien/nen-tang-ui/table";
import { StatusBadge, type StatusTone } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import type { DongExcel, KetQuaKhop, LoiDongExcel } from "@/2-quy-trinh/doc-don-hang-excel";

/**
 * HỘP XEM TRƯỚC KHI ĐỔ FILE EXCEL VÀO BẢNG "HÀNG TIỀN".
 *
 * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 17/08/2026: nhập Excel phải *"báo lỗi theo TỪNG DÒNG (số dòng trong
 * file + lý do) chứ không chỉ một câu 'file sai'"*, và *"nên có bước xem trước trước khi đổ
 * vào bảng"*.
 *
 * VÌ SAO CẦN BƯỚC XEM TRƯỚC: trước đây app đọc file rồi ĐỔ THẲNG vào biểu mẫu, sau đó mới in
 * ra một khối báo cáo bên dưới. Người lập đã mất số liệu đang gõ dở trước khi kịp biết file có
 * dùng được hay không — mà bấm nhầm file thì không có nút hoàn lại. Nay soát xong mới đổ.
 *
 * 🔴 BỀ RỘNG PHẢI VIẾT `sm:max-w-…`. `DialogContent` của base-nova đã có sẵn `sm:max-w-sm`
 * trong lớp gốc; viết `max-w-5xl` trơn thì thua ở độ ưu tiên và bị đè IM LẶNG — không lỗi
 * lint, không lỗi build, hộp cứ kẹt 384px và bảng bên trong không đọc được. Đã dính thật
 * 15/08/2026 với 9 hộp thoại trong app.
 */

/** Một dòng file gộp lại để bày cho người dùng soát, đã có sẵn kết luận. */
interface DongXemTruoc {
  dongTrongFile: number;
  tenHang: string;
  donViTinh?: string;
  soLuong?: number;
  donGia?: number;
  thueSuat?: number;
  /** Kết luận ngắn hiện ở cột trạng thái. */
  ketLuan: string;
  tong: StatusTone;
  /** Câu giải thích thêm — vì sao bị bỏ, hoặc sẽ đổ vào dòng đề nghị nào. */
  chiTiet?: string;
  /** Dòng này có được đổ vào bảng không. */
  seDo: boolean;
}

export interface DuLieuXemTruocExcel {
  tenFile: string;
  khop: KetQuaKhop["khop"];
  khongKhop: DongExcel[];
  khongLapDuoc: KetQuaKhop["khongLapDuoc"];
  /**
   * ★ DÒNG HÀNG CỦA ĐƠN KHÔNG GẮN ĐỀ NGHỊ (18/08/2026) — vào bảng thẳng, không đối chiếu.
   *
   * 🔴 KHÔNG nhét vào `khop`: `khop` mang theo `sttDeNghi` và câu giải thích *"Đề nghị dòng
   * N"*, mà ở chế độ độc lập không có đề nghị nào để chỉ. In một số dòng đề nghị bịa ra là
   * đúng kiểu "giao diện hứa một việc app không làm".
   *
   * ⚠️ Ở chế độ độc lập thì `khop` / `khongKhop` / `khongLapDuoc` đều RỖNG — app không chạy
   * `khopVoiDeNghi` nữa. Vẫn giữ ba trường đó vì đường có đề nghị dùng nguyên như cũ.
   */
  dongTuDo?: DongExcel[];
  /**
   * Đang ở chế độ đơn không gắn đề nghị.
   *
   * 🔴 KHÔNG suy từ `dongTuDo.length > 0`: file rỗng cũng cho mảng rỗng, mà lúc đó câu nhắc
   * "Tải file mẫu để lấy bản đã sẵn mặt hàng của đề nghị này" lại hiện ra — hứa một việc
   * không có thật vì làm gì có đề nghị nào.
   */
  nhapTuDo?: boolean;
  dongGhiChu: DongExcel[];
  dongLoi: LoiDongExcel[];
  thieuCot: string[];
  canhBao: string[];
  bangTrong: boolean;
  /** Tên mặt hàng trên phiếu đề nghị, tra theo số thứ tự dòng — để nói rõ sẽ đổ vào đâu. */
  tenDongDeNghi: Record<number, string>;
}

export function HopXemTruocNhapExcel({
  mo,
  duLieu,
  onDong,
  onDo,
}: {
  mo: boolean;
  duLieu: DuLieuXemTruocExcel | null;
  onDong: () => void;
  /** Người dùng đồng ý đổ vào bảng. */
  onDo: () => void;
}) {
  if (!duLieu) return null;

  /* Gộp mọi dòng của file về MỘT bảng rồi sắp theo SỐ DÒNG TRONG FILE.
     🔴 Sắp theo số dòng file chứ không gom theo nhóm kết luận: người dùng soát bằng cách mở
     file Excel bên cạnh và dò xuống, nên thứ tự phải trùng thứ tự trong file. Gom nhóm thì
     họ phải nhảy qua lại giữa ba bảng để tìm một dòng. */
  const dongBay: DongXemTruoc[] = [
    ...duLieu.khop.map((k) => ({
      dongTrongFile: k.dongExcel.dongTrongFile,
      tenHang: k.dongExcel.tenHang,
      donViTinh: k.dongExcel.donViTinh,
      soLuong: k.dongExcel.soLuong,
      donGia: k.dongExcel.donGia,
      thueSuat: k.dongExcel.thueSuatGTGT,
      ketLuan: k.vuotKhoiLuong ? "Vượt khối lượng" : "Đưa vào đơn",
      tong: (k.vuotKhoiLuong ? "warning" : "success") as StatusTone,
      chiTiet: `Đề nghị dòng ${k.sttDeNghi}${
        duLieu.tenDongDeNghi[k.sttDeNghi] ? ` — ${duLieu.tenDongDeNghi[k.sttDeNghi]}` : ""
      }${k.vuotKhoiLuong ? ". Khi cất đơn sẽ tự cắt về phần còn được đặt." : ""}`,
      seDo: true,
    })),
    ...(duLieu.dongTuDo ?? []).map((e) => ({
      dongTrongFile: e.dongTrongFile,
      tenHang: e.tenHang,
      donViTinh: e.donViTinh,
      soLuong: e.soLuong,
      donGia: e.donGia,
      thueSuat: e.thueSuatGTGT,
      ketLuan: "Đưa vào đơn",
      tong: "success" as StatusTone,
      chiTiet:
        "Đơn này không gắn phiếu đề nghị nên app không đối chiếu tên hàng với hồ sơ nào — số liệu vào bảng đúng như trong file.",
      seDo: true,
    })),
    ...duLieu.dongGhiChu.map((g) => ({
      dongTrongFile: g.dongTrongFile,
      tenHang: g.tenHang,
      ketLuan: "Ghi chú",
      tong: "neutral" as StatusTone,
      chiTiet: "Chèn thành một dòng ghi chú trong bảng, không có khối lượng và không tính tiền.",
      seDo: true,
    })),
    ...duLieu.khongLapDuoc.map((k) => ({
      dongTrongFile: k.dongExcel.dongTrongFile,
      tenHang: k.dongExcel.tenHang,
      donViTinh: k.dongExcel.donViTinh,
      soLuong: k.dongExcel.soLuong,
      donGia: k.dongExcel.donGia,
      ketLuan: "Chưa lập được đơn",
      tong: "warning" as StatusTone,
      /* Tách hẳn khỏi "không có trong đề nghị": mặt hàng NÀY CÓ trong đề nghị, chỉ là lúc
         này không đặt được. Gộp chung là đẩy người dùng đi dò lại tên hàng vô ích. */
      chiTiet: `Có trong đề nghị nhưng ${k.lyDo} — không đổ vào bảng.`,
      seDo: false,
    })),
    ...duLieu.khongKhop.map((d) => ({
      dongTrongFile: d.dongTrongFile,
      tenHang: d.tenHang,
      donViTinh: d.donViTinh,
      soLuong: d.soLuong,
      donGia: d.donGia,
      ketLuan: "Không có trong đề nghị",
      tong: "danger" as StatusTone,
      chiTiet:
        "Tên trong file không trùng mặt hàng nào của đề nghị này. Sửa tên trong file cho gần với tên trên phiếu đề nghị, hoặc thêm dòng bằng tay rồi điền số liệu.",
      seDo: false,
    })),
    ...duLieu.dongLoi.map((l) => ({
      dongTrongFile: l.dongTrongFile,
      tenHang: l.tenHang ?? "(không đọc được tên hàng)",
      ketLuan: "Không đọc được",
      tong: "danger" as StatusTone,
      chiTiet: l.lyDo,
      seDo: false,
    })),
  ].sort((a, b) => a.dongTrongFile - b.dongTrongFile);

  const soSeDo = dongBay.filter((d) => d.seDo).length;
  const soBoQua = dongBay.length - soSeDo;

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      {/* 🔴 `sm:max-w-5xl` — xem chú thích đầu file. Bảng dưới có 7 cột, hộp 384px là vô dụng. */}
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Xem trước trước khi đổ vào bảng</DialogTitle>
          <DialogDescription>
            File <strong>{duLieu.tenFile}</strong> — đọc được {dongBay.length} dòng.{" "}
            {soSeDo} dòng sẽ đưa vào bảng
            {soBoQua > 0 ? `, ${soBoQua} dòng bị bỏ qua (xem lý do từng dòng bên dưới)` : ""}.
          </DialogDescription>
        </DialogHeader>

        {/* ===== THIẾU CỘT — nói ĐÍCH DANH tên cột, không nói chung chung "file sai định dạng" */}
        {duLieu.thieuCot.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
            <span>
              Không tìm thấy cột <strong>{duLieu.thieuCot.join(", ")}</strong> trong dòng tiêu đề
              của file. Phần dữ liệu của các cột đó sẽ để trống, phải nhập tay sau khi đổ.
            </span>
          </div>
        )}

        {/* ===== BẢNG TRỐNG — tình huống rất hay gặp, phải chỉ đúng việc phải làm ===== */}
        {duLieu.bangTrong && (
          <div className="flex items-start gap-2 rounded-lg border border-danger bg-danger-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger-soft" aria-hidden />
            <span>
              Vùng bảng hàng của file <strong>không có ô dữ liệu nào</strong> — đây là biểu mẫu
              trống chứ không phải đơn đã điền.{" "}
              {duLieu.nhapTuDo
                ? "Mở file ra điền Tên hàng, ĐVT, SL, Đơn giá cho từng dòng rồi chọn lại. Bấm Tải file mẫu để lấy bản có sẵn đúng dòng tiêu đề mà app đọc được."
                : "Bấm Tải file mẫu để lấy bản đã sẵn mặt hàng của đề nghị này."}
            </span>
          </div>
        )}

        {/* ===== TỪNG DÒNG =====
            🔴 `max-h` + cuộn dọc: file 60 dòng thì hộp phải cuộn bên trong, không được cao quá
            màn hình rồi đẩy hai nút Hủy / Đổ ra ngoài tầm nhìn. `min-w-0` để bảng cuộn ngang
            bên trong hộp thay vì kéo giãn hộp. */}
        {dongBay.length > 0 && (
          <div className="max-h-[55vh] min-w-0 overflow-y-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* 🔴 "Dòng trong file" là SỐ DÒNG THẬT của Excel, đúng số ở lề trái khi mở
                      file — chỗ người dùng bấm vào để sửa. Không phải số thứ tự app tự đánh. */}
                  <TableHead className="w-24">Dòng file</TableHead>
                  <TableHead>Tên hàng</TableHead>
                  <TableHead>ĐVT</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">% Thuế</TableHead>
                  <TableHead>Kết luận</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dongBay.map((d) => (
                  <TableRow key={`${d.dongTrongFile}-${d.ketLuan}-${d.tenHang}`}>
                    <TableCell className="tabular-nums text-text-secondary">
                      Dòng {d.dongTrongFile}
                    </TableCell>
                    <TableCell className="max-w-64 whitespace-normal text-text-primary">
                      {d.tenHang}
                    </TableCell>
                    <TableCell className="text-text-secondary">{d.donViTinh ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums text-text-secondary">
                      {d.soLuong !== undefined ? d.soLuong.toLocaleString("vi-VN") : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-text-secondary">
                      {d.donGia !== undefined ? d.donGia.toLocaleString("vi-VN") : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-text-secondary">
                      {d.thueSuat !== undefined ? `${d.thueSuat}%` : "—"}
                    </TableCell>
                    <TableCell className="max-w-80 whitespace-normal">
                      {/* Trạng thái luôn có CẢ màu lẫn chữ — Design System V1.1. */}
                      <StatusBadge label={d.ketLuan} tone={d.tong} />
                      {d.chiTiet && (
                        <span className="mt-1 block text-xs text-text-desc">{d.chiTiet}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Cảnh báo chung của bộ đọc (ô đọc không ra số, dòng bỏ qua…) — vẫn phải bày, không nuốt. */}
        {duLieu.canhBao.length > 0 && (
          <ul className="flex flex-col gap-1 text-xs text-text-secondary">
            {duLieu.canhBao.map((c) => (
              <li key={c}>· {c}</li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Hủy
          </Button>
          <Button
            onClick={() => {
              onDo();
              onDong();
            }}
            /* Không có dòng nào đổ được thì khóa nút — bấm vào cũng không có gì xảy ra, mà
               nút bấm được rồi không thấy gì đổi là người dùng tưởng app hỏng. */
            disabled={soSeDo === 0}
          >
            {soSeDo === 0 ? (
              <FileSpreadsheet className="size-4" aria-hidden />
            ) : (
              <Check className="size-4" aria-hidden />
            )}
            {soSeDo === 0 ? "Không có dòng nào đổ được" : `Đổ ${soSeDo} dòng vào bảng`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
