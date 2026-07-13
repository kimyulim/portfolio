"use client";

import Image from "next/image";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { List, useListRef, type RowComponentProps } from "react-window";
import { PORTFOLIO_IMAGE_SIZES } from "./portfolio-image-sizes";

export const IMAGE_COUNT = PORTFOLIO_IMAGE_SIZES.length;

export const PORTFOLIO_IMAGES = Array.from({ length: IMAGE_COUNT }, (_, index) => {
  const page = index + 1;
  const [width, height] = PORTFOLIO_IMAGE_SIZES[index];

  return {
    page,
    src: `/images/portfolio_${page}.png`,
    alt: `Portfolio ${page}`,
    width,
    height,
  };
});

const OVERSCAN_COUNT = 4;
// 각 행 하단 여백(pb-2 = 8px). rowHeight 계산과 행 마크업이 함께 써야 하는 값.
const ROW_BOTTOM_PADDING = 8;

type PortfolioRowProps = {
  images: typeof PORTFOLIO_IMAGES;
};

function PortfolioRow({
  index,
  style,
  images,
}: RowComponentProps<PortfolioRowProps>) {
  const { page, src, alt, width, height } = images[index];

  return (
    <div style={style}>
      <div
        id={`page-${page}`}
        className="block bg-[#171717] leading-[0]"
        style={{ paddingBottom: ROW_BOTTOM_PADDING }}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="100vw"
          quality={100}
          unoptimized
          style={{ width: "100%", height: "auto" }}
          preload={page === 1}
          loading={page <= 2 ? "eager" : "lazy"}
          className="portfolio-image m-0 block max-w-full p-0"
        />
      </div>
    </div>
  );
}

export type VirtualPortfolioListHandle = {
  scrollToPage: (page: number) => void;
  scrollToTop: () => void;
};

type VirtualPortfolioListProps = {
  className?: string;
};

const VirtualPortfolioList = forwardRef<
  VirtualPortfolioListHandle,
  VirtualPortfolioListProps
>(function VirtualPortfolioList({ className }, ref) {
  const listRef = useListRef(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  // 스크롤바를 제외한 리스트의 실제 콘텐츠 폭. 이미지가 이 폭으로 렌더링되므로
  // 행 높이를 이미지 로드 전에 정확히 계산할 수 있다.
  const [contentWidth, setContentWidth] = useState<number | null>(null);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    const element = listRef.current?.element;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      setContentWidth(element.clientWidth);
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [listRef, viewport.width, viewport.height]);

  const rowWidth = contentWidth ?? viewport.width;

  const getRowHeight = useCallback(
    (index: number) => {
      const [width, height] = PORTFOLIO_IMAGE_SIZES[index];
      return Math.round((rowWidth * height) / width) + ROW_BOTTOM_PADDING;
    },
    [rowWidth],
  );

  // 진행 중인 착지 감시 루프 취소 함수
  const cancelLandingWatchRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelLandingWatchRef.current?.(), []);

  const scrollToRowExact = useCallback(
    (index: number) => {
      const list = listRef.current;
      if (!list) return;

      cancelLandingWatchRef.current?.();
      list.scrollToRow({ index, align: "start", behavior: "smooth" });

      const element = list.element;
      if (!element) return;

      // 장거리 smooth 스크롤은 통과하는 행들이 마운트/언마운트되는 동안
      // 브라우저가 애니메이션을 중간에 취소할 수 있다. 스크롤이 멈췄는데
      // 목표 오프셋에 도달하지 못했으면 다시 이동시킨다.
      const targetOffset = () => {
        let offset = 0;
        for (let i = 0; i < index; i += 1) offset += getRowHeight(i);
        return Math.min(offset, element.scrollHeight - element.clientHeight);
      };

      const STALL_FRAMES = 10;
      const MAX_SMOOTH_RETRIES = 8;
      let rafId = 0;
      let lastTop = element.scrollTop;
      let stillFrames = 0;
      let retries = 0;

      const cleanup = () => {
        cancelAnimationFrame(rafId);
        element.removeEventListener("wheel", cleanup);
        element.removeEventListener("touchstart", cleanup);
        cancelLandingWatchRef.current = null;
      };
      // 사용자가 직접 스크롤을 시작하면 개입하지 않는다
      element.addEventListener("wheel", cleanup, { passive: true });
      element.addEventListener("touchstart", cleanup, { passive: true });

      const tick = () => {
        const top = element.scrollTop;
        if (top === lastTop) {
          stillFrames += 1;
        } else {
          stillFrames = 0;
          lastTop = top;
        }

        if (stillFrames >= STALL_FRAMES) {
          const target = targetOffset();
          if (Math.abs(top - target) <= 1) {
            cleanup();
            return;
          }
          if (retries >= MAX_SMOOTH_RETRIES) {
            element.scrollTo({ top: target, behavior: "auto" });
            cleanup();
            return;
          }
          retries += 1;
          stillFrames = 0;
          list.scrollToRow({ index, align: "start", behavior: "smooth" });
        }

        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
      cancelLandingWatchRef.current = cleanup;
    },
    [listRef, getRowHeight],
  );

  const scrollToPage = useCallback(
    (page: number) => {
      const index = page - 1;
      if (index < 0 || index >= IMAGE_COUNT) return;

      scrollToRowExact(index);
    },
    [scrollToRowExact],
  );

  const scrollToTop = useCallback(() => {
    scrollToRowExact(0);
  }, [scrollToRowExact]);

  useImperativeHandle(ref, () => ({ scrollToPage, scrollToTop }), [
    scrollToPage,
    scrollToTop,
  ]);

  if (viewport.width <= 0 || viewport.height <= 0) {
    return <div className={className ?? "min-h-screen w-full bg-[#171717]"} />;
  }

  return (
    <div className={className ?? "h-full w-full bg-[#171717]"}>
      <List
        listRef={listRef}
        rowCount={IMAGE_COUNT}
        rowHeight={getRowHeight}
        rowComponent={PortfolioRow}
        rowProps={{ images: PORTFOLIO_IMAGES }}
        overscanCount={OVERSCAN_COUNT}
        className="bg-[#171717]"
        style={{
          height: viewport.height,
          width: viewport.width,
          // 스크롤 앵커링이 smooth 스크롤 애니메이션을 취소하지 못하게 한다
          overflowAnchor: "none",
        }}
      />
    </div>
  );
});

export default VirtualPortfolioList;
