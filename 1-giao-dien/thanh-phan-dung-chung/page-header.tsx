import type { ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/1-giao-dien/nen-tang-ui/breadcrumb";

export interface PageHeaderCrumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  crumbs: PageHeaderCrumb[];
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** Tiêu đề trang dùng chung: breadcrumb + H1 + mô tả phụ + khu vực hành động. */
export function PageHeader({ crumbs, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <span key={crumb.label} className="flex items-center gap-1.5">
                <BreadcrumbItem>
                  {isLast || !crumb.href ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg md:text-xl font-bold text-text-primary leading-tight">{title}</h1>
          {description ? <p className="text-xs text-text-desc leading-tight">{description}</p> : null}
        </div>
        {/* 🔴 KHÔNG `shrink-0` (bỏ 02/10/2026): khung nút không được co thì nhóm nút bên trong không
            bao giờ xuống dòng được — đo trên màn 375px trang Nhà cung cấp (3 nút) tràn ra 450px, nút
            cuối bị cắt mất. Bỏ `shrink-0` + `max-w-full` + `flex-wrap`: màn rộng thì cả cụm vẫn đứng
            cùng hàng như cũ (dòng flex tự xuống trước khi co), màn hẹp thì nút tự xuống dòng. */}
        {actions ? (
          <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
