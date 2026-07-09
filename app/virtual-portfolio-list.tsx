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
import {
  List,
  useDynamicRowHeight,
  useListRef,
  type RowComponentProps,
} from "react-window";

export const IMAGE_COUNT = 119;

export const PORTFOLIO_IMAGES = Array.from({ length: IMAGE_COUNT }, (_, index) => {
  const page = index + 1;

  return {
    page,
    src: `/images/portfolio_${page}.png`,
    alt: `Portfolio ${page}`,
  };
});

const OVERSCAN_COUNT = 4;
const DEFAULT_ASPECT_RATIO = 1.25;

type PortfolioRowProps = {
  images: typeof PORTFOLIO_IMAGES;
  rowHeight: ReturnType<typeof useDynamicRowHeight>;
};

function PortfolioRow({
  index,
  style,
  images,
  rowHeight,
}: RowComponentProps<PortfolioRowProps>) {
  const rowRef = useRef<HTMLDivElement>(null);
  const { page, src, alt } = images[index];

  useEffect(() => {
    const element = rowRef.current;
    if (!element) return;

    return rowHeight.observeRowElements([element]);
  }, [index, rowHeight]);

  return (
    <div style={style}>
      <div
        ref={rowRef}
        id={`page-${page}`}
        className="block bg-[#171717] leading-[0]"
      >
        <Image
          src={src}
          alt={alt}
          width={0}
          height={0}
          sizes="100vw"
          quality={100}
          unoptimized
          style={{ width: "100%", height: "auto" }}
          priority={page === 1}
          loading={page <= 2 ? "eager" : "lazy"}
          className="portfolio-image m-0 block max-w-full p-0"
          onLoad={() => {
            const height = rowRef.current?.getBoundingClientRect().height ?? 0;
            if (height > 0) {
              rowHeight.setRowHeight(index, Math.ceil(height));
            }
          }}
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

  const defaultRowHeight = Math.max(
    320,
    Math.round(viewport.width * DEFAULT_ASPECT_RATIO),
  );

  const dynamicRowHeight = useDynamicRowHeight({
    defaultRowHeight,
    key: viewport.width,
  });

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

  const scrollToPage = useCallback((page: number) => {
    const index = page - 1;
    if (index < 0 || index >= IMAGE_COUNT) return;

    listRef.current?.scrollToRow({
      index,
      align: "start",
      behavior: "smooth",
    });
  }, [listRef]);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToRow({
      index: 0,
      align: "start",
      behavior: "smooth",
    });
  }, [listRef]);

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
        rowHeight={dynamicRowHeight}
        rowComponent={PortfolioRow}
        rowProps={{ images: PORTFOLIO_IMAGES, rowHeight: dynamicRowHeight }}
        overscanCount={OVERSCAN_COUNT}
        className="bg-[#171717]"
        style={{ height: viewport.height, width: viewport.width }}
      />
    </div>
  );
});

export default VirtualPortfolioList;
