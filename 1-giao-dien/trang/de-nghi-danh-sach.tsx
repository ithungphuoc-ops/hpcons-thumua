"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, FileText, Inbox, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { ThanhTienDo } from "@/1-giao-dien/thanh-phan-nghiep-vu/thanh-tien-do";
import {
  BangQuyTrinhMuaHang,
  type ThaoTacThe,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-quy-trinh-mua-hang";
import {
  HopSuaThongTinChung,
  HopSuaThoiHan,
  HopSuaTruongBoSung,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-sua-de-nghi";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/1-giao-dien/nen-tang-ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/1-giao-dien/nen-tang-ui/table";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { tinhTienDoDeNghi, tomTatTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import {
  dungBangQuyTrinh,
  dungXacNhanKeoTha,
  quyetDinhKeoTha,
  type GiaiDoanMuaHang,
  type HanhDongKeoTha,
  type XacNhanKeoTha,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import { HopNhanCongTac } from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-nhan-cong-tac";
import { useNhanCongTac } from "@/1-giao-dien/thanh-phan-nghiep-vu/dung-nhan-cong-tac";
import { NHAN_PHONG_BAN_NGUON, NHAN_TRANG_THAI_DE_NGHI, NHAN_UU_TIEN } from "@/2-quy-trinh/trang-thai";

/** Hai cách xem cùng một dữ liệu — đặt tên giống bảng Base để anh em quen việc đọc ra ngay. */
type CachXem = "bang" | "danh_sach";

export default function TrangDanhSachDeNghi() {
  const router = useRouter();
  const {
    deNghi,
    donHang,
    phieuNhan,
    baoGia,
    thongBao,
    taoBaoGiaGiaLap,
    doiTrangThaiBaoGiaTheoDeNghi,
    dongDoDeNghi,
    suaThongTinChung,
    suaThoiHan,
    doiLuuTru,
    suaTruongBoSung,
    nhanBanDeNghi,
    xoaDeNghi,
  } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const [cachXem, setCachXem] = useState<CachXem>("bang");

  /**
   * Nhận công tác — luật và hệ quả nằm ở hook dùng chung `useNhanCongTac`, vì có ba nơi bấm
   * nhận (chuông · thẻ trên bảng · trang chi tiết). Chép ba bản thì sửa một chỗ lệch hai chỗ.
   */
  const nhanViec = useNhanCongTac();

  /**
   * Hồ sơ đang mở hộp sửa nào — MỘT state cho cả ba hộp (thông tin chung · thời hạn · dữ
   * liệu tùy chỉnh) thay vì ba cờ riêng: gộp lại thì không có cách nào mở trùng hai hộp.
   */
  const [dangSua, setDangSua] = useState<{
    loai: "thong_tin" | "thoi_han" | "truong_bo_sung";
    prId: string;
  } | null>(null);
  /** Đề nghị đang chờ xác nhận xóa — xóa là việc không lùi lại được nên phải hỏi. */
  const [hoiXoa, setHoiXoa] = useState<string | null>(null);

  const dnDangSua = dangSua ? deNghi.find((d) => d.id === dangSua.prId) : undefined;
  const dnHoiXoa = hoiXoa ? deNghi.find((d) => d.id === hoiXoa) : undefined;

  /**
   * Các thao tác của menu ⋯ trên thẻ.
   *
   * 🔴 Bảng quy trình KHÔNG tự gọi kho dữ liệu — nó là component hiển thị thuần. Mọi việc
   * ghi đều quyết định ở đây, đúng ranh giới đã đặt từ đầu (xem chú thích đầu
   * `bang-quy-trinh-mua-hang.tsx`).
   */
  const thaoTacThe: ThaoTacThe = {
    onSuaThongTin: (prId) => setDangSua({ loai: "thong_tin", prId }),
    onSuaThoiHan: (prId) => setDangSua({ loai: "thoi_han", prId }),
    onSuaTruongBoSung: (prId) => setDangSua({ loai: "truong_bo_sung", prId }),
    onNhanBan: (prId) => {
      const id = nhanBanDeNghi(prId, nguoiDung.tenHienThi);
      if (!id) {
        // Nói thật khi không tạo được, đừng im lặng để người dùng tưởng đã nhân bản xong.
        toast.error("Không nhân bản được", {
          description: "Đã hết mã dự phòng cho bản chạy thử (tối đa 12 đề nghị).",
        });
        return;
      }
      toast.success("Đã nhân bản", {
        description: "Bản sao chưa phân bổ cho ai — phân bổ lại trước khi đi tiếp.",
        action: { label: "Mở bản sao", onClick: () => router.push(`/de-nghi/${id}`) },
      });
    },
    onDoiLuuTru: (prId, luuTru) => {
      doiLuuTru(prId, luuTru, nguoiDung.tenHienThi);
      toast.success(luuTru ? "Đã lưu trữ" : "Đã bỏ lưu trữ", {
        description: luuTru
          ? "Hồ sơ ẩn khỏi bảng nhưng vẫn nguyên trạng thái. Xem lại ở tab Danh sách."
          : "Hồ sơ quay lại đúng cột trên bảng.",
      });
    },
    onXoa: (prId) => setHoiXoa(prId),
  };

  /**
   * Việc kéo thả đang chờ người dùng xác nhận.
   *
   * ⚠️ CỜ MỞ TÁCH RIÊNG khỏi nội dung là CỐ Ý. Nếu vừa xóa nội dung vừa đóng hộp trong
   * cùng một nhịp, cây con bị gỡ ngay giữa lúc hộp thoại đang chạy animation đóng —
   * kết quả là **hộp rỗng và lớp phủ kẹt lại trên màn hình**, người dùng không bấm được gì.
   * Đã dính lỗi này khi làm; giữ nội dung lại cho tới lần mở sau là hết.
   */
  const [xacNhan, setXacNhan] = useState<{
    prId: string;
    hanhDong: HanhDongKeoTha;
    noiDung: XacNhanKeoTha;
  } | null>(null);
  const [moHopXacNhan, setMoHopXacNhan] = useState(false);

  const danhSach = useMemo(
    () =>
      deNghi.map((dn) => {
        const tienDo = tinhTienDoDeNghi(dn, donHang, phieuNhan);
        return {
          dn,
          tomTat: tomTatTienDoDeNghi(tienDo),
          soChuaPhanBo: tienDo.filter((d) => d.trangThaiDong === "chua_phan_bo").length,
        };
      }),
    [deNghi, donHang, phieuNhan],
  );

  const cot = useMemo(
    () => dungBangQuyTrinh(deNghi, donHang, baoGia, phieuNhan),
    [deNghi, donHang, baoGia, phieuNhan],
  );

  // Thông báo MỚI NHẤT của từng đề nghị (mảng đã xếp mới nhất đứng đầu) —
  // để thẻ trên bảng hiện "Chờ tiếp nhận" / "Đã nhận: [tên]" cho bước hiện tại.
  const tiepNhanTheoPr = useMemo(() => {
    const m = new Map<string, (typeof thongBao)[number]>();
    for (const tb of thongBao) if (!m.has(tb.prId)) m.set(tb.prId, tb);
    return m;
  }, [thongBao]);

  /**
   * Thả thẻ vào cột: hỏi `quyetDinhKeoTha` (2-quy-trinh) xem bước chuyển này ứng với
   * nghiệp vụ gì. Bước KHÔNG hợp lệ thì báo lý do luôn; bước hợp lệ thì MỞ HỘP XÁC NHẬN
   * chứ không làm ngay.
   *
   * 🔴 Vì sao phải hỏi lại (chỉ đạo Ban lãnh đạo 08/08/2026): kéo thả rất dễ trượt tay,
   * mà mỗi bước ở đây là một nghiệp vụ thật (tạo bảng báo giá, chốt so sánh, đóng dở).
   * Lỡ tay là sinh chứng từ thừa, và người sau đọc bảng tưởng bước trước đã xong.
   */
  function xuLyTha(prId: string, dich: GiaiDoanMuaHang) {
    const the = cot.flatMap((c) => c.the).find((t) => t.deNghi.id === prId);
    if (!the) return;

    const poCuaDeNghi = donHang.filter((po) => po.prId === prId && po.trangThai !== "huy");
    const baoGiaCuaDeNghi = baoGia.filter((b) => b.prId === prId && b.trangThai !== "huy");
    const hanhDong = quyetDinhKeoTha(the, dich, poCuaDeNghi, baoGiaCuaDeNghi);
    if (!hanhDong) return;

    // Bước không hợp lệ: chặn ngay, không cần hỏi — hỏi rồi vẫn không cho làm thì vô nghĩa.
    if (hanhDong.loai === "khong_the") {
      toast.error("Không chuyển được", { description: hanhDong.lyDo });
      return;
    }

    setXacNhan({
      prId,
      hanhDong,
      noiDung: dungXacNhanKeoTha(
        the,
        dich,
        hanhDong,
        poCuaDeNghi,
        phieuNhan.filter((p) => poCuaDeNghi.some((po) => po.id === p.poId)),
      ),
    });
    setMoHopXacNhan(true);
  }

  /** Thực thi sau khi người dùng đã bấm xác nhận trong hộp thoại. */
  function thucThiKeoTha(prId: string, hanhDong: HanhDongKeoTha) {
    const the = cot.flatMap((c) => c.the).find((t) => t.deNghi.id === prId);
    if (!the) return;

    switch (hanhDong.loai) {
      case "tao_bao_gia": {
        const id = taoBaoGiaGiaLap(prId, nguoiDung.tenHienThi);
        if (id) {
          toast.success("Đã tạo bảng báo giá", {
            description: `${the.deNghi.code} chuyển sang "Yêu cầu NCC báo giá".`,
          });
        } else {
          toast.error("Đã hết chỗ cho bảng báo giá thử", {
            description: "Bản chạy thử chỉ tạo được 12 bảng báo giá. Tải lại trang để về dữ liệu gốc.",
          });
        }
        break;
      }
      case "chot_so_sanh":
        doiTrangThaiBaoGiaTheoDeNghi(prId, "dang_thu_thap", "da_so_sanh", nguoiDung.tenHienThi);
        toast.success("Đã chốt đủ báo giá", {
          description: `${the.deNghi.code} chuyển sang "Xét duyệt báo giá".`,
        });
        break;
      case "dong_do":
        // Hộp xác nhận đã hỏi rồi (nút tông nguy hiểm) nên ở đây làm luôn,
        // không hỏi lại lần hai trên thông báo như trước.
        dongDoDeNghi(prId, nguoiDung.tenHienThi);
        toast.success("Đã đóng dở đề nghị", { description: the.deNghi.code });
        break;
      case "mo_trang":
        toast.info("Bước này cần thao tác nghiệp vụ", { description: hanhDong.thongBao });
        router.push(hanhDong.duongDan);
        break;
      case "khong_the":
        // Đã chặn ở `xuLyTha` trước khi mở hộp xác nhận — nhánh này chỉ để đủ kiểu.
        toast.error("Không chuyển được", { description: hanhDong.lyDo });
        break;
    }
  }

  return (
    <>
      {/* Tiêu đề và thanh chọn cách xem gộp một khối, cách nhau hẹp — để thanh
          tab dính liền tiêu đề đúng như bảng Base, không hở một dải trống. */}
      <div className="flex flex-col gap-(--hp-md-card-gap)">
        <PageHeader
          crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Quy trình mua hàng" }]}
          title="Quy trình mua hàng"
          description="Đề nghị đã duyệt, nhận từ Phòng Thi công qua HPcore"
          actions={
            /* Công cụ CHẠY THỬ — ở bản thật đề nghị tự vào từ HPcore, không có nút này.
               Xem 1-giao-dien/trang/de-nghi-nhan-moi.tsx */
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href="/de-nghi/nhan-moi" />}
            >
              <Inbox className="size-4" aria-hidden />
              Nhận đề nghị mới (giả lập)
            </Button>
          }
        />

        {/* Cao 44px trên điện thoại cho đủ vùng chạm theo V1.1. */}
        <Tabs value={cachXem} onValueChange={(v) => setCachXem(v as CachXem)}>
          <TabsList variant="line" className="h-auto md:h-9">
            <TabsTrigger value="bang" className="h-11 px-3 md:h-[calc(100%-1px)]">
              <LayoutGrid aria-hidden />
              Dạng bảng
            </TabsTrigger>
            <TabsTrigger value="danh_sach" className="h-11 px-3 md:h-[calc(100%-1px)]">
              <List aria-hidden />
              Danh sách
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {deNghi.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Chưa có đề nghị nào"
          description="Đề nghị đã duyệt từ HPcore sẽ tự xuất hiện ở đây."
        />
      ) : cachXem === "bang" ? (
        // `flex-1` + `min-h-[420px]`: bảng chiếm trọn phần màn hình còn lại,
        // màn quá thấp thì vẫn giữ tối thiểu 420px rồi cuộn trang như thường.
        // `data-rong-toan-man`: xin khung tổng bỏ giới hạn bề rộng A4 cho riêng
        // màn này — 8 cột cần trải hết bề ngang mới chia đều được (xem `khung-tong.tsx`).
        <div data-rong-toan-man className="flex min-h-[420px] flex-1 flex-col gap-2">
          <BangQuyTrinhMuaHang
            cot={cot}
            keoThaDuoc={quyen.lapPO}
            onTha={xuLyTha}
            tiepNhan={tiepNhanTheoPr}
            // Nút "Nhận công tác" ngay trên thẻ (chỉ đạo Ban lãnh đạo 10/08/2026). Chỉ vai trò
            // làm nghiệp vụ mới thấy — người chỉ xem thì thẻ giữ nhãn "Chờ tiếp nhận".
            onNhanCongTac={quyen.lapPO ? (tb) => nhanViec.moHoiNhan(tb) : undefined}
            // Nhân viên chưa được chia việc thì thẻ giữ nhãn "Chờ tiếp nhận", không hiện nút
            // (chỉ đạo Ban lãnh đạo 10/08/2026) — luật ở `lyDoKhongNhanCongTac`.
            duocNhan={(tb) => nhanViec.lyDoKhongNhan(tb) === null}
            // Menu ⋯ chỉ mở cho vai trò làm nghiệp vụ; người chỉ xem không thấy thao tác ghi.
            thaoTac={quyen.lapPO ? thaoTacThe : undefined}
          />

          {/* Hộp xác nhận dùng chung với chuông thông báo — xem `hop-nhan-cong-tac.tsx`. */}
          <HopNhanCongTac
            thongBao={nhanViec.hoiNhan}
            seTuChuyenBuoc={nhanViec.seTuChuyenBuoc(nhanViec.hoiNhan)}
            onDong={nhanViec.dongHoiNhan}
            onDongY={nhanViec.xacNhanNhan}
          />

          {/* ===== BA HỘP SỬA của menu ⋯ ===== */}
          {dnDangSua && (
            <>
              <HopSuaThongTinChung
                mo={dangSua?.loai === "thong_tin"}
                deNghi={dnDangSua}
                onDong={() => setDangSua(null)}
                onLuu={(moi) => {
                  suaThongTinChung(dnDangSua.id, moi, nguoiDung.tenHienThi);
                  toast.success("Đã lưu thông tin chung", { description: dnDangSua.code });
                }}
              />
              <HopSuaThoiHan
                mo={dangSua?.loai === "thoi_han"}
                deNghi={dnDangSua}
                onDong={() => setDangSua(null)}
                onLuu={(ngayMoi, lyDo) => {
                  suaThoiHan(dnDangSua.id, ngayMoi, lyDo, nguoiDung.tenHienThi);
                  toast.success("Đã đổi thời hạn", {
                    description: `${dnDangSua.code} — lý do đã ghi vào nhật ký.`,
                  });
                }}
              />
              <HopSuaTruongBoSung
                mo={dangSua?.loai === "truong_bo_sung"}
                deNghi={dnDangSua}
                onDong={() => setDangSua(null)}
                onLuu={(truong) => {
                  suaTruongBoSung(dnDangSua.id, truong, nguoiDung.tenHienThi);
                  toast.success("Đã lưu dữ liệu tùy chỉnh", { description: dnDangSua.code });
                }}
              />
            </>
          )}

          {/* ===== XÁC NHẬN XÓA =====
              🔴 Xóa hẳn hồ sơ là việc nặng nhất trong menu; kho dữ liệu còn chặn thêm một lớp
              nếu đề nghị đã phát sinh báo giá / đơn hàng (xem `xoaDeNghi`). */}
          <HopXacNhan
            mo={hoiXoa !== null}
            tieuDe="Xóa hẳn đề nghị này?"
            moTa={
              dnHoiXoa
                ? `${dnHoiXoa.code} — ${dnHoiXoa.tieuDe}, ${dnHoiXoa.items.length} dòng vật tư.`
                : undefined
            }
            canhBao="Xóa là mất hẳn, không khôi phục được. Muốn giữ dấu vết để thống kê thì dùng “Đánh dấu thất bại”; muốn dọn bảng cho gọn thì dùng “Lưu trữ”."
            nhanDongY="Xóa hẳn"
            nguyHiem
            onDong={() => setHoiXoa(null)}
            onDongY={() => {
              if (!hoiXoa) return;
              const lyDo = xoaDeNghi(hoiXoa);
              if (lyDo) {
                toast.error("Không xóa được", { description: lyDo });
                return;
              }
              toast.success("Đã xóa đề nghị");
            }}
          />
          {quyen.lapPO && (
            <p className="text-xs text-text-desc">
              Kéo thẻ sang cột kế tiếp để làm bước đó: bước làm ngay được thì thẻ tự chuyển, bước
              cần quyết định (chọn NCC, lập đơn, ghi phiếu nhận) sẽ mở đúng màn hình tương ứng.
            </p>
          )}
        </div>
      ) : (
        <Card>
          <CardContent>
            {/* Bảng — Desktop/Tablet */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đề nghị</TableHead>
                    <TableHead>Công trình</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Cần hàng</TableHead>
                    <TableHead className="text-right">Số dòng</TableHead>
                    <TableHead>Phân bổ</TableHead>
                    <TableHead>Tiến độ nhận</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {danhSach.map(({ dn, tomTat, soChuaPhanBo }) => {
                    const tt = NHAN_TRANG_THAI_DE_NGHI[dn.trangThai];
                    const ut = NHAN_UU_TIEN[dn.mucDoUuTien];
                    return (
                      <TableRow key={dn.id}>
                        <TableCell>
                          <Link
                            href={`/de-nghi/${dn.id}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {dn.code}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">{dn.tenCongTrinh}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col gap-1">
                            <span>{dn.tieuDe}</span>
                            {dn.mucDoUuTien === "gap" && <StatusBadge label={ut.nhan} tone={ut.tong} />}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-text-desc">
                          {NHAN_PHONG_BAN_NGUON[dn.phongBanNguon]}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(dn.ngayCanHang).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right">{dn.items.length}</TableCell>
                        <TableCell>
                          {soChuaPhanBo > 0 ? (
                            <StatusBadge label={`Thiếu ${soChuaPhanBo} dòng`} tone="danger" />
                          ) : (
                            <StatusBadge label="Đủ" tone="success" />
                          )}
                        </TableCell>
                        <TableCell>
                          <ThanhTienDo
                            phanTram={tomTat.phanTram}
                            tong={tomTat.phanTram === 100 ? "success" : "primary"}
                            nhan={`${tomTat.soDongDaNhanDu}/${tomTat.tongSoDong} mặt hàng`}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge label={tt.nhan} tone={tt.tong} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Card List — Mobile */}
            <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
              {danhSach.map(({ dn, tomTat, soChuaPhanBo }) => {
                const tt = NHAN_TRANG_THAI_DE_NGHI[dn.trangThai];
                return (
                  <Link
                    key={dn.id}
                    href={`/de-nghi/${dn.id}`}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-primary">{dn.code}</span>
                      <StatusBadge label={tt.nhan} tone={tt.tong} />
                    </div>
                    <span className="text-sm text-text-primary">{dn.tieuDe}</span>
                    <span className="text-xs text-text-desc">{dn.tenCongTrinh}</span>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-desc">Cần hàng</span>
                      <span>{new Date(dn.ngayCanHang).toLocaleDateString("vi-VN")}</span>
                    </div>
                    {soChuaPhanBo > 0 && <StatusBadge label={`Thiếu ${soChuaPhanBo} dòng chưa phân bổ`} tone="danger" />}
                    <ThanhTienDo
                      phanTram={tomTat.phanTram}
                      tong={tomTat.phanTram === 100 ? "success" : "primary"}
                      nhan={`${tomTat.soDongDaNhanDu}/${tomTat.tongSoDong} mặt hàng đã nhận đủ`}
                    />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* HỘP XÁC NHẬN CHUYỂN BƯỚC — chặn thao tác lỡ tay khi kéo thả.
          Chỉ đạo Ban lãnh đạo 08/08/2026. */}
      <Dialog open={moHopXacNhan} onOpenChange={setMoHopXacNhan}>
        <DialogContent className="max-w-lg">
          {xacNhan && (
            <>
              <DialogHeader>
                <DialogTitle>Chuyển bước cho {xacNhan.noiDung.maDeNghi}?</DialogTitle>
                <DialogDescription>
                  Kiểm lại một lượt trước khi chuyển — thao tác này tạo chứng từ thật.
                </DialogDescription>
              </DialogHeader>

              {/* Bước cũ → bước mới, để người dùng thấy ngay mình vừa kéo đi đâu */}
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted p-(--hp-md-row-pad) text-sm">
                <span className="font-medium text-text-primary">{xacNhan.noiDung.tuBuoc}</span>
                <ArrowRight className="size-4 shrink-0 text-text-desc" aria-hidden />
                <span className="font-semibold text-primary">{xacNhan.noiDung.denBuoc}</span>
              </div>

              <p className="text-sm text-text-secondary">{xacNhan.noiDung.seLam}</p>

              {/* Việc còn dang dở ở bước hiện tại — CẢNH BÁO, không chặn.
                  Có cả biểu tượng và chữ theo V1.1, không chỉ dựa vào màu. */}
              {xacNhan.noiDung.canhBao.length > 0 && (
                <div className="flex flex-col gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad)">
                  <p className="flex items-center gap-2 text-sm font-semibold text-warning-soft">
                    <AlertTriangle className="size-4 shrink-0" aria-hidden />
                    Bước hiện tại còn việc chưa xong
                  </p>
                  <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-text-secondary">
                    {xacNhan.noiDung.canhBao.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-text-desc">
                    Vẫn chuyển được nếu việc này đã xử lý xong ngoài hệ thống — đây chỉ là
                    nhắc để khỏi kéo nhầm.
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setMoHopXacNhan(false)}>
                  Hủy, giữ nguyên
                </Button>
                <Button
                  variant={xacNhan.noiDung.nguyHiem ? "destructive" : "default"}
                  onClick={() => {
                    setMoHopXacNhan(false);
                    thucThiKeoTha(xacNhan.prId, xacNhan.hanhDong);
                  }}
                >
                  {xacNhan.noiDung.nhanNut}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
