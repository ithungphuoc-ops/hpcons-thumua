import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
/* ★ Thêm 15/09/2026 (có phép Sếp): mở thêm MỘT kết nối Admin SDK sang project `hpcons-request`
   để tự đọc loại đề nghị — xem `docLoaiTuHoSoAppRequest` cuối tệp. Phần `FieldValue` và
   `getHpcoreDb` của phiên tích hợp giữ nguyên, không đụng. */
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { FieldValue, getFirestore, type Firestore } from "firebase-admin/firestore";
import { getHpcoreDb } from "@/5-ket-noi/hpcore-may-chu";
import { DUONG_DAN, bo0Undefined } from "@/3-du-lieu/kho-chung-firestore";
import { maDeNghiTiepTheo } from "@/2-quy-trinh/dat-ten-de-nghi";
import {
  chuanHoaLoaiHoSo,
  layLoaiTuHoSoAppRequest,
  quyDoiPhongBan,
  tachCongTrinhTuChuoi,
  xacDinhMaDuAnTamThoi,
} from "@/2-quy-trinh/tich-hop-app-request";
import type {
  DeNghiMuaHang,
  DongDeNghi,
  DonDatHang,
  LoaiHoSoDeNghi,
} from "@/3-du-lieu/kieu-du-lieu";
import type { DuLieuLuu } from "@/3-du-lieu/luu-tren-may";
import type { DeNghiMoiTuAppRequest, KetQuaNhanDeNghiTuAppRequest } from "@/3-du-lieu/tich-hop-app-request-types";
import { boDau } from "@/6-tien-ich/bo-dau";
import { TEN_COLLECTION_NHAT_KY } from "@/3-du-lieu/nhat-ky-he-thong";
import { soNgayDaTroiQua } from "@/2-quy-trinh/tinh-toan";

// "Cửa tiếp nhận" của App Thu mua cho App Request — xem hợp đồng dữ liệu đầy đủ tại
// 3-du-lieu/tich-hop-app-request-types.ts.
//
// Gọi cho MỌI đề xuất duyệt xong bên App Request (có công trình hay không) — khác nhánh họ
// đang gọi sang QLK CTR (chỉ có ý nghĩa khi có công trình). Việc 1, Sếp chốt 19/08/2026.
//
//   POST /api/app-request/de-nghi-moi
//
// Bảo vệ tạm bằng header x-api-key nếu đã cấu hình APP_REQUEST_API_KEY — chưa cấu hình thì
// API vẫn chạy được ngay (để test trước khi 2 đội thống nhất khóa), đúng kiểu QLK CTR đang
// làm với chính App Request.
//
// 📌 Dùng CHUNG kết nối Admin SDK với cầu nối SSO (`getHpcoreDb()` ở
// `5-ket-noi/hpcore-may-chu.ts`) — cùng project `hpcons-portal`, không cần khóa/project riêng
// nào khác cho route này (20/08/2026, sau khi xác nhận lại với IT).
export async function POST(req: NextRequest): Promise<NextResponse<KetQuaNhanDeNghiTuAppRequest>> {
  const apiKeyYeuCau = process.env.APP_REQUEST_API_KEY;
  if (apiKeyYeuCau) {
    const apiKeyGui = req.headers.get("x-api-key");
    if (apiKeyGui !== apiKeyYeuCau) {
      return NextResponse.json({ ok: false, error: "Thiếu hoặc sai x-api-key." }, { status: 401 });
    }
  }

  let payload: DeNghiMoiTuAppRequest;
  try {
    payload = (await req.json()) as DeNghiMoiTuAppRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Body gửi lên không phải JSON hợp lệ." }, { status: 400 });
  }

  if (!payload.requestCode?.trim() || !payload.nguoiGuiEmail?.trim() || !payload.vatTu?.length) {
    return NextResponse.json(
      { ok: false, error: "Thiếu dữ liệu bắt buộc (requestCode / nguoiGuiEmail / vatTu)." },
      { status: 400 },
    );
  }

  try {
    const db = getHpcoreDb();
    const docRef = db.collection(DUONG_DAN.boSuuTap).doc(DUONG_DAN.tep);

    /**
     * ★★ XÁC ĐỊNH LOẠI HỒ SƠ (công trình / phòng ban) — BA BƯỚC, ĐÚNG THỨ TỰ NÀY.
     * Thêm 15/09/2026, **có phép riêng của Sếp** (tệp vùng cấm §6.6). Chỉ đạo Sếp:
     * *"API của app request e đã có rồi, e chỉ cần link thêm trường phòng ban đó là xong mà,
     * giải quyết theo phương án tối ưu nhất đi chứ"*.
     *
     *   ① Payload CÓ `loaiDeNghi` → dùng luôn. RẺ NHẤT: không gọi ra ngoài, không tốn lượt đọc.
     *      (Hôm nay App Request CHƯA gửi trường này; để sẵn cho ngày họ cập nhật.)
     *   ② Không có, nhưng CÓ `requestId` → **tự đọc sang App Request**. Đây là đường đang chạy
     *      thật: `idHoSoAppRequest` có ở 16/16 đề nghị, và đọc ra loại 16/16, lệch 0 so với phép
     *      suy `maHopDongCDT` rỗng (đo 15/09/2026).
     *   ③ Vẫn không ra → **để trống**. `laHoSoPhongBan` (`2-quy-trinh/ho-so-phong-ban.ts`) tự rơi
     *      về tầng dự phòng `maHopDongCDT` rỗng. KHÔNG đoán bừa, và tuyệt đối không mặc định
     *      "công trình".
     *
     * 🔴 ĐỌC TRƯỚC KHI VÀO TRANSACTION, KHÔNG ĐỌC BÊN TRONG. Transaction của Firestore có thể
     * **chạy lại nhiều lượt** khi có tranh chấp ghi; nhét một lời gọi mạng vào trong là mỗi lượt
     * lại gọi lại, kéo dài thời gian giữ transaction và nhân lượt đọc lên. Ở ngoài thì đúng một
     * lần, và kết quả chỉ là một giá trị thuần đem vào dùng.
     *
     * ⚠️ TỐN THÊM 1 LƯỢT ĐỌC KHI APP REQUEST GỬI TRÙNG (retry mạng): lúc đó hồ sơ đã có sẵn nên
     * giá trị này không dùng tới. Chấp nhận — một document mỗi lần gọi, và đổi lại là không phải
     * gọi mạng bên trong transaction (xem lý do ngay trên).
     */
    const loaiHoSo: LoaiHoSoDeNghi | undefined =
      chuanHoaLoaiHoSo(payload.loaiDeNghi) ?? (await docLoaiTuHoSoAppRequest(payload.requestId));

    // Transaction: đọc + kiểm trùng + ghi trong một bước — chặn trường hợp App Request gọi
    // lại 2 lần gần nhau (retry do mạng lỗi) tạo ra 2 đề nghị trùng mã đề xuất.
    const ketQua = await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      const data = (snap.exists ? snap.data() : {}) as Partial<DuLieuLuu>;
      const deNghiHienCo: DeNghiMuaHang[] = Array.isArray(data.deNghi) ? data.deNghi : [];

      const trungRoi = deNghiHienCo.find((d) => d.maDeXuatAppRequest === payload.requestCode);
      if (trungRoi) {
        /**
         * ★★ VÁ THIẾU `idHoSoAppRequest` CHO HỒ SƠ CŨ — thêm 13/09/2026, có phép riêng của Sếp
         * (tệp này thuộc vùng cấm phiên tích hợp, CLAUDE.md §6.6).
         *
         * 🔴 VÌ SAO CẦN: app chỉ bắt đầu LƯU `requestId` từ bản deploy trưa 13/09/2026. Mọi đề
         * nghị nhận trước đó (đo được: 28/29 hồ sơ, từ 29/08 tới 13/09) không có trường này, nên
         * ô 09 "Đường dẫn đề nghị" của chúng rơi về liên kết nội bộ thay vì mở hồ sơ bên App
         * Request. Mà nhánh trùng này TRƯỚC ĐÂY `return` ngay, không ghi gì — tức App Request có
         * gửi lại bao nhiêu lần thì hồ sơ cũ cũng KHÔNG BAO GIỜ được bổ sung.
         *
         * 👉 Nay chỉ cần App Request bắn lại một lần là hồ sơ tự có link. Không cần ai vào sửa
         * tay, không cần đọc chéo cơ sở dữ liệu của đội khác.
         *
         * 📌 CHỈ ĐIỀN KHI ĐANG TRỐNG, KHÔNG BAO GIỜ ĐÈ. Đã có id rồi mà App Request gửi id khác
         * thì giữ cái cũ — id là danh tính hồ sơ bên họ, đè bừa là trỏ sang nhầm hồ sơ, loại lỗi
         * không ai phát hiện cho tới lúc đối chiếu chứng từ.
         *
         * 📌 VÁ CẢ BẢN SAO: lọc theo `maDeXuatAppRequest` chứ không chỉ đúng `trungRoi`, vì phiếu
         * nhân bản (`(copy 1)`, `(copy 2)`…) mang CÙNG mã đề xuất và cùng trỏ về một hồ sơ gốc
         * bên App Request. Bỏ sót là mỗi lần tách phiếu lại đẻ thêm một hồ sơ không có link.
         *
         * ⚠️ KHÔNG đụng bất kỳ trường nào khác của hồ sơ cũ. Đây là cửa tiếp nhận, không phải
         * cửa cập nhật — người dùng đã sửa tay tên công trình / số hợp đồng thì phải giữ nguyên.
         */
        const idHoSo = payload.requestId?.trim();
        /* ★ VÁ CẢ DANH MỤC TỆP, không riêng id — thêm 13/09/2026 (chiều). Bản đầu chỉ vá
           `idHoSoAppRequest`, nên hồ sơ về trước hôm nay dù App Request bắn lại bao nhiêu lần
           thì ô 13 vẫn hiện "—". Cùng một lý do, cùng một chỗ, nên vá luôn cả hai. */
        const tepMoi = duongDanTepAppRequest(payload.taiLieuDinhKem);
        const thieuId = Boolean(idHoSo) && !trungRoi.idHoSoAppRequest;
        const thieuTep = Boolean(tepMoi?.length) && !trungRoi.taiLieuAppRequest?.length;

        if (thieuId || thieuTep) {
          const deNghiDaVa = deNghiHienCo.map((d) => {
            if (d.maDeXuatAppRequest !== payload.requestCode) return d;
            const d2 = { ...d };
            /* CHỈ ĐIỀN KHI ĐANG TRỐNG, KHÔNG BAO GIỜ ĐÈ — người dùng có thể đã sửa tay. */
            if (idHoSo && !d2.idHoSoAppRequest) d2.idHoSoAppRequest = idHoSo;
            if (tepMoi?.length && !d2.taiLieuAppRequest?.length) d2.taiLieuAppRequest = tepMoi;
            return d2;
          });
          tx.set(docRef, bo0Undefined({ deNghi: deNghiDaVa }), { merge: true });
          return {
            moi: false as const,
            deNghi: {
              ...trungRoi,
              ...(thieuId ? { idHoSoAppRequest: idHoSo } : {}),
              ...(thieuTep ? { taiLieuAppRequest: tepMoi } : {}),
            },
          };
        }
        return { moi: false as const, deNghi: trungRoi };
      }

      const congTrinh = tachCongTrinhTuChuoi(payload.congTrinhChuoi);
      const maPhongBan = quyDoiPhongBan(payload.phongBan);
      const maDuAnTam = xacDinhMaDuAnTamThoi(congTrinh, maPhongBan);
      const maDaDung = deNghiHienCo.map((d) => d.code);
      const maMoi = maDeNghiTiepTheo(maDuAnTam, maDaDung);

      const ngayCanHang = payload.ngayCanGiao || congThemNgay(payload.ngayDuyet, 7);

      const items: DongDeNghi[] = payload.vatTu.map((vt, i) => ({
        stt: i + 1,
        tenVatLieu: vt.tenVatTu,
        quyCach: vt.quyCach,
        donViTinh: vt.dvt,
        khoiLuongDeNghi: vt.soLuong,
        mucDichSuDung: vt.mucDichSuDung,
      }));

      const deNghiMoi: DeNghiMuaHang = {
        id: randomUUID(),
        code: maMoi,
        maDuAn: maDuAnTam,
        maHopDongCDT: congTrinh?.maHopDongCDT,
        tenCongTrinh: congTrinh?.tenCongTrinh ?? "",
        tieuDe: payload.tieuDe?.trim() || `Đề nghị từ App Request #${payload.requestCode}`,
        phongBanNguon: maPhongBan,
        nguoiDeNghiUid: payload.nguoiGuiUid || payload.nguoiGuiEmail,
        nguoiDeNghiTen: payload.nguoiGuiTen,
        ngayDeNghi: payload.ngayGui || payload.ngayDuyet,
        ngayDuyet: payload.ngayDuyet,
        ngayCanHang,
        mucDoUuTien: "binh_thuong",
        trangThai: "da_duyet",
        items,
        lichSu: [
          {
            thoiDiem: new Date().toISOString(),
            nguoiThucHien: "Hệ thống (App Request)",
            hanhDong: "Tạo tự động từ đề xuất đã duyệt",
            ghiChu: `Mã đề xuất App Request: ${payload.requestCode}`,
          },
        ],
        maDeXuatAppRequest: payload.requestCode,
        /**
         * ★★ LOẠI HỒ SƠ — CÔNG TRÌNH hay PHÒNG BAN, lấy từ ô "Lựa chọn đề nghị" của App Request.
         * Thêm 15/09/2026, **có phép riêng của Sếp** (*"A đã báo rồi, e sửa đi"* — tệp này thuộc
         * vùng cấm phiên tích hợp, CLAUDE.md §6.6; ghi lại để họ đọc ra là CÓ PHÉP).
         *
         * 🔴 THUẦN THÊM: chỉ chép thêm một trường mới (xem khối "BA BƯỚC" phía trên để biết giá
         * trị `loaiHoSo` từ đâu ra), không đụng nhánh logic nào đang chạy — kiểm trùng, tách công
         * trình, tự động khớp PO đều nguyên vẹn.
         *
         * 🔴 VÌ SAO CẦN: hồ sơ phòng ban phải đi nhánh riêng (Sếp duyệt 15/09/2026) vì không có
         * kho công trình nào gửi phiếu nhận sang. Hai phép suy gián tiếp đã đo là SAI trên dữ
         * liệu thật (`tenCongTrinh` rỗng → 0/16, `maDuAn` bắt đầu `"PB-"` → 0/16) vì App Request
         * đang nhét TIÊU ĐỀ ĐỀ NGHỊ vào cả hai ô đó.
         *
         * ⚠️ `undefined` KHI CẢ BA BƯỚC ĐỀU KHÔNG RA — cố ý, không đoán bừa. `bo0Undefined` bỏ
         * hẳn khoá, và `laHoSoPhongBan` rơi về tầng dự phòng (`maHopDongCDT` rỗng) đúng như hồ sơ
         * cũ vẫn chạy từ trước tới nay.
         */
        loaiHoSo,
        /**
         * ★★ LƯU ID KỸ THUẬT ĐỂ DỰNG ĐƯỢC ĐƯỜNG DẪN MỞ HỒ SƠ BÊN APP REQUEST — thêm 13/09/2026.
         *
         * 🔴🔴 TỆP NÀY THUỘC VÙNG CẤM SỬA CỦA PHIÊN TÍCH HỢP APP TỔNG (CLAUDE.md §6.6, chỉ đạo
         * Sếp 20/08/2026). Dòng này được thêm bởi PHIÊN NGHIỆP VỤ THU MUA, và **có phép riêng
         * của Sếp ngày 13/09/2026** — Sếp được hỏi trước, chọn "cho phép em sửa lần này".
         * Ghi lại ở đây để phiên tích hợp đọc ra là CÓ PHÉP, không phải bị đè code.
         *
         * 🔴 THUẦN THÊM, KHÔNG ĐỔI HÀNH VI CŨ: chỉ chép thêm một trường vốn đã có sẵn trong
         * payload (`requestId`) mà trước nay bị vứt đi. Không đụng bất kỳ nhánh logic, phép
         * kiểm trùng, hay đường tự động khớp PO nào.
         *
         * 🔴 VÌ SAO CẦN: Ban lãnh đạo yêu cầu ô "Đường dẫn đề nghị" phải mở được hồ sơ bên App
         * Request. Đã đo 13/09/2026: App Request CHỈ mở bằng id kỹ thuật
         * (`/request/list?scope=all&id=<requestId>`); thử `?code=`, `?id=<mã 6 số>`, `?q=` đều
         * KHÔNG mở đúng hồ sơ. Không lưu trường này thì không có cách nào dựng link.
         *
         * ⚠️ Đề nghị đã tạo TRƯỚC hôm nay không có trường này — chỗ hiển thị phải chịu được
         * việc thiếu (xem `idHoSoAppRequest` trong `3-du-lieu/kieu-du-lieu.ts`).
         */
        idHoSoAppRequest: payload.requestId,
        /**
         * ★★ GIỮ LẠI DANH MỤC TỆP NGƯỜI ĐỀ NGHỊ ĐÍNH KÈM — thêm 13/09/2026, có phép riêng của Sếp
         * (tệp vùng cấm, CLAUDE.md §6.6).
         *
         * 🔴 Trước đó `payload.taiLieuDinhKem` bị NHẬN RỒI VỨT (grep trong tệp này = 0 dòng), nên
         * ô 13 "Tài liệu đính kèm" của MỌI hồ sơ từ App Request luôn hiện `—` dù người đề nghị có
         * nộp kèm thật. Ban lãnh đạo phát hiện trên màn hình.
         *
         * 📌 CHỈ LƯU DANH MỤC, KHÔNG TẢI NỘI DUNG. `url` App Request gửi là link ký sẵn có
         * `X-Amz-Expires=300` — sống 5 phút, lưu lại là link chết. Nên ở đây chỉ giữ TÊN (và
         * đường dẫn để đối chiếu), còn muốn xem tệp thì bấm sang hồ sơ bên App Request. Việc tải
         * hẳn tệp về kho riêng là bước sau, Sếp đã biết và chọn làm sau.
         *
         * 📌 `undefined` khi App Request không gửi gì — `bo0Undefined` sẽ bỏ hẳn khóa, không để
         * lại mảng rỗng khiến giao diện vẽ ra một khối "Tài liệu đính kèm (0)".
         */
        taiLieuAppRequest: duongDanTepAppRequest(payload.taiLieuDinhKem),
      };

      /**
       * ★★★ TỰ ĐỘNG ĐIỀN PO "CHỜ ĐỀ NGHỊ" — thêm 29/08/2026 (Sếp chốt qua demo "Ngã Rẽ Lập
       * PO"), việc 3 của Cách 3: PO lập trước qua module độc lập, đề nghị về sau qua đường
       * bình thường này, tự khớp lại — không cần app Đề Xuất biết gì về PO bên Thu Mua.
       *
       * 🔴 CHỈ ĐIỀN, KHÔNG TỰ CHỐT — sửa lại 29/08/2026 (chiều), sau review PR (CodeRabbit +
       * nội bộ): bản đầu tự set `trangThai: "da_chot"` ngay khi khớp — Sếp xác nhận CẦN thêm
       * một lớp NGƯỜI THẬT xác nhận trước khi chốt, vì `maDuAn` dù đúng khuôn Thông báo 09/2026
       * vẫn có xác suất trùng ngẫu nhiên giữa hai dự án khác nhau (lỗi đặt mã, dự án đổi tên…).
       * PO vẫn GIỮ `"cho_de_nghi"` sau khi điền `prId`/`prCode` — chỉ khác trước ở chỗ giờ đã có
       * `prId` (phân biệt với PO "cho_de_nghi" CHƯA khớp gì bằng chính field này, xem
       * `HopGanDeNghi`/`HopXacNhanTuDongGan`). Trưởng bộ phận xác nhận thật ở
       * `xacNhanTuDongGanDeNghi` (`kho-du-lieu.tsx`) mới chuyển "da_chot".
       *
       * 🔴 KHÓA CHÍNH LÀ `maDuAn`, KHÔNG PHẢI "Theo hợp đồng" — đọc kỹ trước khi đổi:
       * `maHopDongCDT` của đề nghị chỉ là phần TRƯỚC dấu " - " trong ô "Tên đề xuất"
       * (`tachCongTrinhTuChuoi`), một MÃ NGẮN theo khuôn Thông báo 09/2026 — CÙNG KHUÔN với
       * `maDuAn` bên PO (chọn từ dự án có sẵn hoặc gõ tay theo đúng khuôn đó). Còn "Theo hợp
       * đồng" bên PO (từ 27/08/2026) là GHI CHÚ TỰ DO cả câu ("HĐ số 089/2026/HĐKT-HPC ký
       * ngày 01/08") — không cùng định dạng với mã ngắn bên đề nghị, so trực tiếp hai chuỗi
       * này dễ trật. Vì vậy `maDuAn` là điều kiện BẮT BUỘC; "Theo hợp đồng" chỉ là TÍN HIỆU
       * PHỤ — có ở cả hai bên mà KHÁC nhau (sau khi chuẩn hoá) thì coi là cờ báo động, dừng
       * lại không tự gắn; thiếu ở một bên (rất hay gặp, vì cả hai đều là ô tuỳ chọn) thì
       * không tính là mâu thuẫn, vẫn cho gắn theo `maDuAn`.
       *
       * 🔴 CHỈ ĐIỀN KHI TÌM RA ĐÚNG 1 ỨNG VIÊN. Ra 0 hoặc ≥2 kết quả đều để nguyên "chờ đề
       * nghị" KHÔNG `prId` — nhiều PO cùng mã dự án là chuyện thật (nhiều lần mua cho cùng công
       * trình), tự chọn bừa 1 cái là gắn nhầm PO của người khác vào đề nghị này. Người dùng vẫn
       * gắn tay được qua hộp thoại "+ Gắn đề nghị" (`hop-gan-de-nghi.tsx`) như bình thường.
       *
       * ⚠️ KHÔNG GỌI `vuongMacLapDonHang`/`vuongMacViecBatBuocCacBuocTruoc` Ở ĐÂY, và cũng
       * KHÔNG gọi ở bước xác nhận sau này — khác `ganDeNghiVaoPO` (gắn tay từ danh sách báo giá
       * đã chốt). Đã cân nhắc kỹ, không phải bỏ sót:
       *   · `vuongMacLapDonHang` đòi ít nhất MỘT `BaoGia` của đề nghị. `deNghiMoi` ở route này
       *     VỪA được tạo ra trong chính request này (giai đoạn ①) — CHƯA THỂ nào có `BaoGia`
       *     nào cả, vì báo giá là bước ③ làm SAU, thủ công, bên trong Thu Mua, và có thể KHÔNG
       *     BAO GIỜ xảy ra cho đề nghị này (PO đã tự đủ NCC/giá từ lúc lập độc lập). Gọi hàm
       *     này ở đây (hoặc ở bước xác nhận) luôn trả về chặn ("Chưa có bảng báo giá nào…") —
       *     tính năng tự khớp sẽ CHẾT. Kiểm soát chi tiêu của PO ĐỘC LẬP là quyền `taoPoDoiLap`
       *     (chỉ Trưởng bộ phận trở lên) ĐÃ CHẠY khi PO được TẠO (`themDonHang`) — NCC/đơn giá/
       *     hợp đồng của PO đó đã được người có thẩm quyền quyết định RỒI.
       *   · `vuongMacViecBatBuocCacBuocTruoc` soát các bước TRƯỚC bước hiện tại — `deNghiMoi`
       *     luôn ở giai đoạn ① (`viTriHienTai <= 0`) nên hàm này luôn trả `null` (không có gì
       *     để soát); gọi vào đây là code chết, không thêm an toàn nào.
       * Lớp an toàn cho đường này là XÁC NHẬN NGƯỜI THẬT (`xacNhanTuDongGanDeNghi`), không phải
       * chạy lại 2 hàm trên — mục tiêu là bắt lỗi TRÙNG MÃ DỰ ÁN NGẪU NHIÊN giữa hai công
       * trình khác nhau, không phải bắt lỗi thiếu báo giá (không áp dụng cho đường này).
       */
      const donHangHienCo: DonDatHang[] = Array.isArray(data.donHang) ? data.donHang : [];
      const chuanHoa = (s: string) => boDau(s).replace(/[^a-z0-9]/g, "");
      const ungVien = donHangHienCo.filter((po) => {
        if (po.trangThai !== "cho_de_nghi" || po.maDuAn !== deNghiMoi.maDuAn) return false;
        if (po.maHopDongCDT && deNghiMoi.maHopDongCDT) {
          const a = chuanHoa(po.maHopDongCDT);
          const b = chuanHoa(deNghiMoi.maHopDongCDT);
          /**
           * ★ NGƯỠNG ĐỘ DÀI TỐI THIỂU (6 ký tự) trước khi coi 1 chuỗi "chứa" chuỗi kia là
           * bằng chứng khớp — thêm sau review PR, phát hiện mã ngắn thuần số (vd "0001") dễ là
           * substring TRÙNG NGẪU NHIÊN của một mã hợp đồng dài không liên quan (vd "260001hpcs"),
           * biến "mâu thuẫn" thật thành "khớp" giả. Chuỗi quá ngắn thì coi như KHÔNG SO ĐƯỢC —
           * lùi về đúng nhánh "thiếu 1 bên" (bỏ qua, không tính mâu thuẫn), không suy diễn.
           */
          if (a.length >= 6 && b.length >= 6 && !a.includes(b) && !b.includes(a)) return false;
        }
        return true;
      });

      let donHangMoi = donHangHienCo;
      let poDaGan: DonDatHang | null = null;
      if (ungVien.length === 1) {
        const po = ungVien[0];
        const poMoi: DonDatHang = {
          ...po,
          prId: deNghiMoi.id,
          prCode: deNghiMoi.code,
          maDeXuatAppRequest: deNghiMoi.maDeXuatAppRequest,
          // ⚠️ GIỮ "cho_de_nghi" — KHÔNG tự chốt "da_chot". Xem khối chú thích phía trên
          // ("CHỈ ĐIỀN, KHÔNG TỰ CHỐT") và `xacNhanTuDongGanDeNghi` (`kho-du-lieu.tsx`).
          trangThai: "cho_de_nghi",
        };
        donHangMoi = donHangHienCo.map((p) => (p.id === po.id ? poMoi : p));
        poDaGan = poMoi;
        const soNgay = soNgayDaTroiQua(po.ngayLapPO);
        deNghiMoi.lichSu.push({
          thoiDiem: new Date().toISOString(),
          nguoiThucHien: "Hệ thống (tự động khớp App Request)",
          hanhDong: "Tự động điền đơn hàng đã lập trước — chờ xác nhận",
          ghiChu: `Đơn hàng ${po.code} — lập trước ${soNgay} ngày, cùng mã dự án ${po.maDuAn}. Chờ Trưởng bộ phận xác nhận ở trang chi tiết đơn hàng.`,
        });
      }

      tx.set(
        docRef,
        bo0Undefined({ deNghi: [...deNghiHienCo, deNghiMoi], donHang: donHangMoi }),
        { merge: true },
      );

      if (poDaGan) {
        // ★ MINH BẠCH — ghi thẳng bằng Admin SDK (route này không có phiên đăng nhập người
        // dùng để dùng `ghiNhatKyHeThong` phía client). Cùng collection, cùng hình dạng dữ
        // liệu — trang "Nhật ký hệ thống" đọc được bình thường, không cần biết ai ghi.
        tx.create(db.collection(TEN_COLLECTION_NHAT_KY).doc(), {
          thoiDiem: FieldValue.serverTimestamp(),
          nguoiThucHienUid: "he-thong",
          nguoiThucHienTen: "Hệ thống (tự động khớp App Request)",
          hanhDong: "tu_dong_dien_de_nghi_cho_xac_nhan",
          moTa: `Tự động điền đề nghị ${deNghiMoi.code} vào đơn hàng ${poDaGan.code} — khớp mã dự án ${poDaGan.maDuAn}. Đơn vẫn ở "Chờ đề nghị", chờ Trưởng bộ phận xác nhận.`,
        });
      }

      return { moi: true as const, deNghi: deNghiMoi };
    });

    return NextResponse.json({
      ok: true,
      trangThai: ketQua.moi ? "da_tao" : "da_ton_tai",
      deNghiId: ketQua.deNghi.id,
      maDeNghi: ketQua.deNghi.code,
    });
  } catch (error) {
    console.error("Lỗi nhận đề nghị từ App Request:", error);
    const thongBaoLoi = error instanceof Error ? error.message : "Lỗi không xác định.";
    return NextResponse.json({ ok: false, error: thongBaoLoi }, { status: 500 });
  }
}

/** Cộng thêm N ngày vào một mốc ISO "YYYY-MM-DD", trả về cùng dạng. */
/**
 * ★★ ĐỔI LIÊN KẾT TỆP APP REQUEST GỬI SANG → ĐƯỜNG DẪN BỀN.
 *
 * 🔴 SỬA MỘT LỖI ĐO ĐƯỢC 13/09/2026, ngay trong ngày vừa thêm tính năng. Bản đầu lưu thẳng
 * `t.url` vào `duongDan`. Đọc lại dữ liệu thật của đề nghị `000000086` thì thấy giá trị đã lưu là:
 *     https://hpcons-request.<tài khoản>.r2.cloudflarestorage.com/requests/74532009-…/tên.pdf
 *       ?X-Amz-Algorithm=…&X-Amz-Expires=300&X-Amz-Signature=…
 * — tức một LIÊN KẾT KÝ SẴN SỐNG 5 PHÚT, đã chết ngay lúc người dùng mở hồ sơ ra xem. Cất một
 * liên kết chết vào cơ sở dữ liệu thì vô dụng, mà tên trường lại hứa là "đường dẫn" nên người
 * đọc sau tưởng dùng được.
 *
 * 👉 Cắt bỏ phần ký, chỉ giữ ĐƯỜNG DẪN trong kho: `requests/74532009-…/tên.pdf`.
 * Khuôn này khớp đúng trường `attachments[].path` mà App Request lưu trong Firestore của họ (đã
 * đối chiếu cùng ngày), nên về sau muốn ký lại để tải, hoặc muốn đối chiếu xem đúng tệp nào, thì
 * đều dùng được.
 *
 * ⚠️ Giữ NGUYÊN chuỗi gốc khi không phân tích được thành địa chỉ web — thà lưu một giá trị lạ để
 * người sau còn nhìn thấy mà lần, hơn là bỏ trắng rồi không ai biết đã từng có gì.
 */
function duongDanTepAppRequest(
  ds: { ten: string; url: string }[] | undefined,
): { ten: string; duongDan?: string }[] | undefined {
  if (!ds?.length) return undefined;
  return ds.map((t) => {
    const tho = (t.url ?? "").trim();
    if (tho === "") return { ten: t.ten };
    try {
      /* `pathname` đã bỏ chuỗi truy vấn (phần `?X-Amz-…`); bỏ nốt dấu `/` đầu cho khớp khuôn
         `attachments[].path` của App Request. `decodeURIComponent` để tên tệp tiếng Việt đọc
         được, không phải dãy `%C3%A0`. */
      const duong = new URL(tho).pathname.replace(/^\/+/, "");
      return { ten: t.ten, duongDan: decodeURIComponent(duong) || tho };
    } catch {
      return { ten: t.ten, duongDan: tho };
    }
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════
// ★★ ĐỌC LOẠI ĐỀ NGHỊ THẲNG TỪ APP REQUEST — thêm 15/09/2026, CÓ PHÉP RIÊNG CỦA SẾP
// (tệp này thuộc vùng cấm sửa của phiên tích hợp, CLAUDE.md §6.6 — ghi lại để họ đọc ra là
// CÓ PHÉP, không phải bị đè code; và THUẦN THÊM, không xoá dòng nào của họ).
//
// 🔴 VÌ SAO PHẢI TỰ ĐỌC: App Request hiện CHƯA gửi trường loại đề nghị trong payload, mà việc
// tách nhánh hồ sơ phòng ban thì Sếp đã duyệt và cần chạy ngay. `requestId` (= id kỹ thuật hồ
// sơ bên họ) thì payload LUÔN có, nên nối sang đọc được ngay hôm nay, không phải chờ ai.
//
// 🔴 PROJECT KHÁC — `hpcons-request`, KHÔNG PHẢI `hpcons-portal`. Vì vậy PHẢI có service
// account riêng và một Admin SDK app riêng (đặt tên `app-request` để không đụng app `hpcore`
// của `5-ket-noi/hpcore-may-chu.ts`). Làm ĐÚNG CÙNG KHUÔN tệp đó: khoá nằm trong BIẾN MÔI
// TRƯỜNG dạng JSON một dòng, KHÔNG BAO GIỜ nhúng vào mã nguồn, và app khởi tạo đúng một lần.
//
// ⚠️ THIẾU BIẾN MÔI TRƯỜNG THÌ KHÔNG ĐƯỢC LÀM HỎNG CỬA TIẾP NHẬN. Đây là đường sống của cả
// quy trình: đề nghị phải vào được app kể cả khi chưa ai cấu hình biến này, kể cả khi App
// Request chậm hay chết. Nên mọi lỗi ở đây đều bị NUỐT có chủ ý — chỉ ghi `console.warn` rồi
// trả `undefined`, và app rơi về tầng dự phòng `maHopDongCDT` rỗng (đã đo: đúng 16/16).
// ════════════════════════════════════════════════════════════════════════════════════════

/** Tên Admin SDK app — KHÁC `"hpcore"` để hai kết nối hai project không đè nhau. */
const TEN_APP_ADMIN_APP_REQUEST = "app-request";

/**
 * Hạn chờ đọc App Request. Ngắn có chủ ý: giá trị đọc được chỉ để chọn nhánh nghiệp vụ, còn
 * việc BẮT BUỘC phải xong là nhận đề nghị vào app. Quá hạn thì bỏ qua, không phải lỗi.
 */
const HAN_DOC_APP_REQUEST_MS = 2500;

let dbAppRequestCache: Firestore | null = null;

function getAppRequestDb(): Firestore {
  if (dbAppRequestCache) return dbAppRequestCache;
  const raw = process.env.APP_REQUEST_FIREBASE_SERVICE_ACCOUNT;
  if (!raw?.trim()) {
    throw new Error(
      "Thiếu APP_REQUEST_FIREBASE_SERVICE_ACCOUNT (JSON service account project hpcons-request).",
    );
  }
  const daCo = getApps().find((a) => a.name === TEN_APP_ADMIN_APP_REQUEST);
  const app: App =
    daCo ??
    initializeApp(
      { credential: cert(JSON.parse(raw) as Parameters<typeof cert>[0]) },
      TEN_APP_ADMIN_APP_REQUEST,
    );
  return (dbAppRequestCache = getFirestore(app));
}

/**
 * Đọc `requests/{idHoSo}` bên App Request rồi rút ra loại đề nghị.
 *
 * `undefined` cho MỌI ca không chắc — thiếu id, thiếu biến môi trường, hồ sơ không còn, quá
 * hạn, mạng lỗi, hoặc hồ sơ không có ô "Lựa chọn đề nghị". KHÔNG BAO GIỜ ném lỗi ra ngoài.
 */
async function docLoaiTuHoSoAppRequest(idHoSo: string | undefined): Promise<LoaiHoSoDeNghi | undefined> {
  const id = idHoSo?.trim();
  if (!id) return undefined;

  let henGio: ReturnType<typeof setTimeout> | undefined;
  try {
    /* Admin SDK không có tham số timeout, nên chặn bằng `Promise.race`. `finally` dọn hẹn giờ —
       bỏ quên là tiến trình bị giữ sống thêm vài giây một cách vô ích. */
    const snap = await Promise.race([
      getAppRequestDb().collection("requests").doc(id).get(),
      new Promise<never>((_, tuChoi) => {
        henGio = setTimeout(
          () => tuChoi(new Error(`Quá ${HAN_DOC_APP_REQUEST_MS}ms khi đọc App Request.`)),
          HAN_DOC_APP_REQUEST_MS,
        );
      }),
    ]);
    return snap.exists ? layLoaiTuHoSoAppRequest(snap.data()) : undefined;
  } catch (error) {
    /* ⚠️ NUỐT LỖI CÓ CHỦ Ý — xem khối chú thích phía trên. Vẫn ghi lại để còn lần ra được khi
       nhánh phòng ban im lặng không bật: dòng log này là manh mối duy nhất. */
    console.warn(
      `Không đọc được loại đề nghị từ App Request (hồ sơ ${id}) — dùng phép suy dự phòng:`,
      error instanceof Error ? error.message : error,
    );
    return undefined;
  } finally {
    if (henGio) clearTimeout(henGio);
  }
}

function congThemNgay(iso: string, soNgay: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + soNgay);
  return d.toISOString().slice(0, 10);
}
