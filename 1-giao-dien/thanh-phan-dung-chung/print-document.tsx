import Image from "next/image";
import type { ReactNode } from "react";

/** Đầu trang chứng từ: logo + pháp nhân + số hiệu — dùng chung cho mọi loại chứng từ in. */
export function PrintHeader({
  documentTitle,
  documentCode,
  meta,
}: {
  documentTitle: string;
  documentCode: string;
  meta?: string;
}) {
  return (
    <header className="mb-6 border-b-2 border-[#096AA7] pb-4">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-3">
          <Image src="/logo-hpc.png" alt="HP Cons" width={56} height={48} className="h-12 w-auto" />
          <div className="text-[11px] leading-snug text-[#475467]">
            <p className="text-sm font-bold text-[#101828]">
              CÔNG TY CỔ PHẦN XÂY DỰNG CÔNG NGHIỆP HƯNG PHƯỚC
            </p>
            <p>Phòng Thu mua</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tracking-wide text-[#096AA7]">{documentTitle}</p>
          <p className="text-sm font-semibold text-[#101828]">{documentCode}</p>
          {meta && <p className="mt-0.5 text-[11px] text-[#475467]">{meta}</p>}
        </div>
      </div>
    </header>
  );
}

/** Khối thông tin dạng nhãn — giá trị, 2 cột trên giấy A4. */
export function PrintInfoGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="mb-5 grid grid-cols-2 gap-x-8 gap-y-2 text-[12px]">
      {items.map((it) => (
        <div key={it.label} className="flex gap-2">
          <dt className="min-w-32 shrink-0 text-[#475467]">{it.label}</dt>
          <dd className="font-medium text-[#101828]">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Bảng chứng từ — viền rõ để in ra giấy đọc được. */
export function PrintTable({
  headers,
  rows,
  footer,
}: {
  headers: { label: string; align?: "right" | "center" }[];
  rows: ReactNode[][];
  footer?: ReactNode[];
}) {
  const alignClass = (a?: "right" | "center") =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  return (
    <table className="w-full border-collapse text-[12px]">
      <thead>
        <tr>
          {headers.map((h) => (
            <th
              key={h.label}
              className={`border border-[#D0D5DD] bg-[#EAF3F9] px-2 py-2 font-semibold text-[#101828] ${alignClass(h.align)}`}
            >
              {h.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((cells, i) => (
          <tr key={i} className="break-inside-avoid">
            {cells.map((cell, j) => (
              <td
                key={j}
                className={`border border-[#D0D5DD] px-2 py-1.5 ${alignClass(headers[j]?.align)}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {footer && (
        <tfoot>
          <tr>
            {footer.map((cell, j) => (
              <td
                key={j}
                className={`border border-[#D0D5DD] bg-[#F9FAFB] px-2 py-2 font-bold ${alignClass(headers[j]?.align)}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        </tfoot>
      )}
    </table>
  );
}

/** Khối chữ ký cuối chứng từ — chừa chỗ ký tay và đóng dấu. */
export function PrintSignatures({ columns }: { columns: string[] }) {
  return (
    <section className="mt-10 break-inside-avoid">
      <div
        className="grid gap-6 text-center text-[12px]"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((c) => (
          <div key={c}>
            <p className="font-semibold text-[#101828]">{c}</p>
            <p className="text-[11px] text-[#475467]">(Ký, ghi rõ họ tên)</p>
            <div className="h-20" />
          </div>
        ))}
      </div>
    </section>
  );
}
