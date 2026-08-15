"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Inbox, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { nhanPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";
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
import { HopNhanBanDeNghi } from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-nhan-ban-de-nghi";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/1-giao-dien/nen-tang-ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/1-giao-dien/nen-tang-ui/table";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { duocNhanBanDeNghi } from "@/4-phan-quyen/quyen-theo-ho-so";
import { tinhTienDoDeNghi, tomTatTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import { soSanhDeNghiUuTien } from "@/2-quy-trinh/sap-xep-uu-tien";
import {
  congViecChuaXongCuaBuoc,
  dungBangQuyTrinh,
  NHAN_GIAI_DOAN,
  dungXacNhanKeoTha,
  quyetDinhKeoTha,
  type GiaiDoanMuaHang,
  type HanhDongKeoTha,
  type XacNhanKeoTha,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import type { CongViecGiaiDoan } from "@/2-quy-trinh/cau-hinh-quy-trinh";
import { HopChuyenGiaiDoan } from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-chuyen-giai-doan";
import { nhanAnToan, NHAN_TRANG_THAI_DE_NGHI, NHAN_UU_TIEN } from "@/2-quy-trinh/trang-thai";

/** Hai cách xem cùng một dữ liệu — đặt tên giống bảng Base để anh em quen việc đọc ra ngay. */
type CachXem = "bang" | "danh_sach";

export default function TrangDanhSachDeNghi() {
  const router = useRouter();
  const {
    deNghi,
    donHang,
    phieuNhan,
    baoGia,
    taoBaoGiaGiaLap,
    doiTrangThaiBaoGiaTheoDeNghi,
    dongDoDeNghi,
    suaThongTinChung,
    suaThoiHan,
    doiLuuTru,
    suaTruongBoSung,
    nhanBanDeNghi,
    xoaDeNghi,
    luiVeBuoc,
    cauHinh,
    ghiLichSuDeNghi,
    datSoBaoGiaChoPhieu,
  } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const [cachXem, setCachXem] = useState<CachXem>("bang");

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
  /** Phiếu đang mở hộp nhân bản — `null` là hộp đóng. */
  const [hoiNhanBan, setHoiNhanBan] = useState<string | null>(null);

  const dnDangSua = dangSua ? deNghi.find((d) => d.id === dangSua.prId) : undefined;
  const dnHoiXoa = hoiXoa ? deNghi.find((d) => d.id === hoiXoa) : undefined;
  const dnHoiNhanBan = hoiNhanBan ? deNghi.find((d) => d.id === hoiNhanBan) : undefined;

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
    // Mở hộp chọn mặt hàng trước, không nhân bản ngay — xem `hop-nhan-ban-de-nghi.tsx`.
    onNhanBan: (prId) => setHoiNhanBan(prId),
    onDoiLuuTru: (prId, luuTru) => {
      doiLuuTru(prId, luuTru, nguoiDung.tenHienThi);
      toast.success(luuTru ? "Đã lưu trữ" : "Đã bỏ lưu trữ", {
        description: luuTru
          ? "Hồ sơ ẩn khỏi bảng nhưng vẫn nguyên trạng thái. Xem lại ở tab Danh sách."
          : "Hồ sơ quay lại đúng cột trên bảng.",
      });
    },
    onXoa: (prId) => setHoiXoa(prId),
    // Nhân viên chỉ tách được phiếu mình phụ trách (Ban lãnh đạo 15/08/2026); trưởng bộ phận
    // và quản trị tách được mọi phiếu. Luật ở `4-phan-quyen/quyen-theo-ho-so.ts`.
    duocNhanBan: (dn) => duocNhanBanDeNghi(dn, nguoiDung.uid, quyen),
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
    /** Mã bước nguồn và bước đích — hộp cần để tra cài đặt của giai đoạn đích. */
    tuBuoc: GiaiDoanMuaHang;
    denBuoc: GiaiDoanMuaHang;
    /** Việc bắt buộc còn treo ở bước hiện tại — hộp hiện và KHÓA nút chuyển. */
    congViecChuaXong: CongViecGiaiDoan[];
  } | null>(null);
  const [moHopXacNhan, setMoHopXacNhan] = useState(false);

  /* 📌 12/08/2026 (chiều): BỎ bộ lọc "đã duyệt". Ban lãnh đạo chốt lại: việc duyệt đề
     nghị diễn ra ở APP KHÁC của bộ phận đề xuất — phiếu vào tới app này nghĩa là ĐÃ duyệt,
     nên bảng quy trình hiện thẳng, không giữ luật duyệt nào ở đây nữa. */

  const danhSach = useMemo(
    () =>
      deNghi
        .map((dn) => {
          const tienDo = tinhTienDoDeNghi(dn, donHang, phieuNhan);
          return {
            dn,
            tomTat: tomTatTienDoDeNghi(tienDo),
            soChuaPhanBo: tienDo.filter((d) => d.trangThaiDong === "chua_phan_bo").length,
          };
        })
        /* Chế độ "Danh sách" xếp CÙNG MỘT HÀM với chế độ "Dạng bảng" — người dùng chuyển qua
           lại giữa hai chế độ, thấy thứ tự khác nhau là tưởng mất hồ sơ. Luật ở
           `2-quy-trinh/sap-xep-uu-tien.ts`, đừng chép lại điều kiện vào đây. */
        .sort((a, b) => soSanhDeNghiUuTien(a.dn, b.dn, nguoiDung.uid)),
    [deNghi, donHang, phieuNhan, nguoiDung.uid],
  );

  /**
   * ★ VIỆC CỦA NGƯỜI ĐANG XEM LÊN ĐẦU MỖI CỘT — Ban lãnh đạo 15/08/2026: *"ở các tài khoản
   * nhân viên, hãy ưu tiên hiển thị các công việc của nhân viên đó đảm nhiệm trước"*.
   *
   * 📌 Truyền uid cho MỌI vai trò, không chỉ nhân viên. Trưởng bộ phận cũng trực tiếp phụ
   * trách một số dòng, và việc của chính mình lên đầu thì cũng đúng với họ. Ai không phụ
   * trách dòng nào thì không thẻ nào được ưu tiên, bảng xếp y như cũ — không cần tách nhánh
   * theo vai trò, một luật chạy đúng cho tất cả.
   */
  const cot = useMemo(
    () => dungBangQuyTrinh(deNghi, donHang, baoGia, phieuNhan, new Date(), nguoiDung.uid),
    [deNghi, donHang, baoGia, phieuNhan, nguoiDung.uid],
  );

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
    // Công việc bắt buộc của bước đang đứng — lấy từ cấu hình quy trình (sửa được ở trang
    // Cài đặt), KHÔNG viết cứng trong luật kéo thả.
    const hanhDong = quyetDinhKeoTha(the, dich, poCuaDeNghi, baoGiaCuaDeNghi, cauHinh);
    if (!hanhDong) return;

    // Bước không hợp lệ: chặn ngay, không cần hỏi — hỏi rồi vẫn không cho làm thì vô nghĩa.
    if (hanhDong.loai === "khong_the") {
      toast.error("Không chuyển được", { description: hanhDong.lyDo });
      return;
    }

    setXacNhan({
      prId,
      hanhDong,
      tuBuoc: the.giaiDoan,
      denBuoc: dich,
      // Việc bắt buộc còn treo — hỏi CHUNG một hàm với luật chặn, để hộp không bao giờ nói
      // khác với thứ app thật sự chặn.
      congViecChuaXong: congViecChuaXongCuaBuoc(the.deNghi, the.giaiDoan, cauHinh),
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
      case "lui_buoc":
        // Hủy chứng từ tương ứng để thẻ thật sự về bước trước — xem `luiVeBuoc`.
        luiVeBuoc(prId, hanhDong.ve, nguoiDung.tenHienThi);
        toast.success("Đã lùi một bước", {
          description: `${the.deNghi.code} về "${NHAN_GIAI_DOAN[hanhDong.ve].nhan}".`,
        });
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
          description="Đề nghị mua hàng đã duyệt, nhận từ các phòng ban trong công ty"
          actions={
            /* 🔴 12/08/2026: bỏ chữ "(giả lập)" và chú thích "ở bản thật đề nghị tự vào từ
               HPcore". Lập đề nghị nay là nghiệp vụ THẬT, mọi tài khoản làm được — để chữ
               "giả lập" là người dùng không dám nhập liệu thật vào đó. */
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href="/de-nghi/nhan-moi" />}
            >
              <Inbox className="size-4" aria-hidden />
              Tạo đề nghị mới
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
          description="Đề nghị đã duyệt của các phòng ban sẽ hiện ở đây."
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
            // Menu ⋯ chỉ mở cho vai trò làm nghiệp vụ; người chỉ xem không thấy thao tác ghi.
            thaoTac={quyen.lapPO ? thaoTacThe : undefined}
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

          {/* ===== NHÂN BẢN — chép phiếu rồi bỏ bớt mặt hàng ngay trong một thao tác.
              Ban lãnh đạo 13/08/2026: tách phiếu để giao cho nhân viên phù hợp. ===== */}
          <HopNhanBanDeNghi
            deNghi={dnHoiNhanBan ?? null}
            mo={hoiNhanBan !== null}
            onDong={() => setHoiNhanBan(null)}
            onXacNhan={(sttGiuLai) => {
              if (!hoiNhanBan) return;
              const goc = dnHoiNhanBan;
              // Truyền cả hàm kiểm quyền: kho dữ liệu tự chặn, không tin vào việc giao diện
              // đã ẩn nút (ẩn nút không phải là chặn).
              const id = nhanBanDeNghi(
                hoiNhanBan,
                { uid: nguoiDung.uid, ten: nguoiDung.tenHienThi },
                sttGiuLai,
                (dn) => duocNhanBanDeNghi(dn, nguoiDung.uid, quyen),
              );
              if (!id) {
                // Nói thật khi không tạo được, đừng im lặng để người dùng tưởng đã xong.
                toast.error("Không nhân bản được", {
                  description: "Đã hết mã dự phòng cho bản chạy thử (tối đa 12 đề nghị).",
                });
                return;
              }
              const tach = goc && sttGiuLai.length < goc.items.length;
              toast.success("Đã nhân bản", {
                description: tach
                  ? `Bản mới giữ ${sttGiuLai.length}/${goc.items.length} mặt hàng, chưa phân bổ cho ai — giao việc trước khi đi tiếp.`
                  : "Bản sao chưa phân bổ cho ai — phân bổ lại trước khi đi tiếp.",
                action: { label: "Mở bản copy", onClick: () => router.push(`/de-nghi/${id}`) },
              });
            }}
          />
          {/* 🔴 NÓI RÕ THẺ TỰ CHUYỂN — Ban lãnh đạo 15/08/2026 hỏi "sao tk trưởng phòng vẫn
              chưa thể kéo chuyển bước 1 sang bước 2 được". Gốc của hiểu nhầm: người dùng tưởng
              phải KÉO thì thẻ mới sang cột, nên cứ kéo đi kéo lại một hồ sơ chưa đủ điều kiện.
              Thật ra làm xong việc của bước là thẻ TỰ sang — kéo thả chỉ là lối tắt để mở đúng
              màn hình làm việc. */}
          {quyen.lapPO && (
            <p className="text-xs text-text-desc">
              <strong>Thẻ tự sang cột kế tiếp khi bước hiện tại làm xong</strong> — không cần
              kéo. Ví dụ phân bổ hết người phụ trách là thẻ tự vào “Yêu cầu NCC báo giá”. Kéo
              thẻ chỉ là lối tắt để mở màn hình làm bước đó. Thẻ nào chưa đi tiếp được thì ghi
              rõ lý do ngay trên thẻ.
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
                    const tt = nhanAnToan(NHAN_TRANG_THAI_DE_NGHI, dn.trangThai);
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
                          {nhanPhongBan(dn.phongBanNguon)}
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
                const tt = nhanAnToan(NHAN_TRANG_THAI_DE_NGHI, dn.trangThai);
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
                    {soChuaPhanBo > 0 && <StatusBadge label={`Thiếu ${soChuaPhanBo} công việc chưa phân bổ`} tone="danger" />}
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
      {/* ★ HỘP CHUYỂN GIAI ĐOẠN — dựng theo ảnh Base Ban lãnh đạo gửi 15/08/2026:
          *"điều chỉnh tính năng kéo thả sang bước tiếp theo, sẽ có cửa sổ thông báo giống
          vậy và các trường nhập thông tin tương tự"*.

          Thay cho hộp xác nhận gọn trước đây. Hộp mới hiện thêm: đầu vào của giai đoạn đích
          (cách giao việc + thời hạn, dạng ô KHÓA), ô ghi chú "Những việc đã hoàn thành?",
          và danh sách công việc bắt buộc còn treo ở bước hiện tại. */}
      {xacNhan && (
        <HopChuyenGiaiDoan
          mo={moHopXacNhan}
          deNghi={deNghi.find((d) => d.id === xacNhan.prId)}
          tuBuoc={xacNhan.tuBuoc}
          denBuoc={xacNhan.denBuoc}
          cauHinh={cauHinh}
          seLam={xacNhan.noiDung.seLam}
          canhBao={xacNhan.noiDung.canhBao}
          nhanNut={xacNhan.noiDung.nhanNut}
          nguyHiem={xacNhan.noiDung.nguyHiem}
          congViecChuaXong={xacNhan.congViecChuaXong}
          onDong={() => setMoHopXacNhan(false)}
          onXacNhan={(ghiChu, soBaoGia) => {
            setMoHopXacNhan(false);
            // Số báo giá đặt TRƯỚC khi chuyển bước: bước ② bắt đầu bằng việc đi hỏi giá, nên
            // yêu cầu phải nằm sẵn trong phiếu lúc nhân viên mở ra.
            if (soBaoGia) {
              datSoBaoGiaChoPhieu(xacNhan.prId, soBaoGia, nguoiDung.tenHienThi);
            }
            // Ghi chú của người chuyển bước vào NHẬT KÝ đề nghị — chỉ ghi khi có nội dung,
            // đừng làm bẩn lịch sử bằng những dòng trống.
            if (ghiChu) {
              ghiLichSuDeNghi(
                xacNhan.prId,
                nguoiDung.tenHienThi,
                `Chuyển bước: ${ghiChu}`,
              );
            }
            thucThiKeoTha(xacNhan.prId, xacNhan.hanhDong);
          }}
        />
      )}
    </>
  );
}
