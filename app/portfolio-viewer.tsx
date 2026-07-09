"use client";

import { useCallback, useRef, useState } from "react";
import VirtualPortfolioList, {
  type VirtualPortfolioListHandle,
} from "./virtual-portfolio-list";

/** 헤더 목차 버튼 — label과 이미지 page 번호(1~119)를 여기서 수정하세요 */
const NAV_INDEX = [
  { id: "1", label: "Resume", page: 2 },
  { id: "2", label: "1.Pinkdeal", page: 4 },
  { id: "3", label: "2.Kyeol", page: 42 },
  { id: "4", label: "3.Coway", page: 74 },
  { id: "5", label: "4.HouseHero", page: 85 },
  { id: "6", label: "5.PDP", page: 113 },
] as const;

type NavItem = {
  id: string;
  label: string;
  page: number;
};

const CONTACT = {
  name: "김유림",
  email: "keemyulim@gmail.com",
  phone: "010.4916.1820",
};

function createId() {
  return crypto.randomUUID();
}

export default function PortfolioViewer() {
  const [navIndex, setNavIndex] = useState<NavItem[]>(
    NAV_INDEX.map((item) => ({ ...item })),
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [password, setPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newPage, setNewPage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const listRef = useRef<VirtualPortfolioListHandle>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  const scrollToPage = useCallback((page: number) => {
    listRef.current?.scrollToPage(page);
  }, []);

  const handleNavSelect = useCallback(
    (page: number) => {
      scrollToPage(page);
      setIsDropdownOpen(false);
    },
    [scrollToPage],
  );

  const handleAdminLogin = () => {
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (!adminPassword) {
      setAdminError("관리자 암호가 설정되지 않았습니다.");
      return;
    }

    if (password === adminPassword) {
      setIsAdmin(true);
      setShowAdminModal(false);
      setPassword("");
      setAdminError("");
      return;
    }

    setAdminError("암호가 올바르지 않습니다.");
  };

  const addNavItem = () => {
    const label = newLabel.trim();
    const page = Number(newPage);

    if (!label || !Number.isInteger(page) || page < 1) return;

    setNavIndex((prev) => [...prev, { id: createId(), label, page }]);
    setNewLabel("");
    setNewPage("");
  };

  const removeNavItem = useCallback((id: string) => {
    setNavIndex((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const moveNavUp = useCallback((index: number) => {
    if (index === 0) return;

    setNavIndex((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveNavDown = useCallback((index: number) => {
    setNavIndex((prev) => {
      if (index >= prev.length - 1) return prev;

      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const scrollToTop = () => {
    listRef.current?.scrollToTop();
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[#171717] text-ink">
      <header
        ref={headerRef}
        className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-[#171717]/70 backdrop-blur-md"
      >
        <div className="flex items-center justify-between gap-4 px-8 py-4 md:gap-6">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-white md:flex-nowrap">
            <span className="shrink-0 font-bold tracking-tight">
              {CONTACT.name}
            </span>
            <a
              href={`mailto:${CONTACT.email}`}
              className="text-sm text-white no-underline transition-transform visited:text-white hover:scale-95 hover:text-white/80 md:shrink-0"
            >
              {CONTACT.email}
            </a>
            <a
              href={`tel:${CONTACT.phone.replace(/\./g, "")}`}
              className="text-sm text-white no-underline transition-transform visited:text-white hover:scale-95 hover:text-white/80 md:shrink-0"
            >
              {CONTACT.phone}
            </a>
          </div>

          <div className="relative shrink-0">
            <nav
              aria-label="프로젝트 목차"
              className="hidden flex-row gap-2 md:flex"
            >
              {navIndex.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavSelect(item.page)}
                  className="shrink-0 rounded-full bg-[#222222] px-4 py-2 text-sm text-white transition-transform hover:scale-95"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex md:hidden">
              <button
                type="button"
                aria-expanded={isDropdownOpen}
                aria-haspopup="menu"
                onClick={() => setIsDropdownOpen((open) => !open)}
                className="shrink-0 rounded-full bg-[#222222] px-4 py-2 text-sm text-white transition-transform hover:scale-95"
              >
                페이지 이동 ▾
              </button>

              {isDropdownOpen && (
                <div
                  role="menu"
                  className="absolute top-full right-0 z-50 mt-2 min-w-[12rem] rounded-xl border border-white/10 bg-[#222222]/95 p-2 backdrop-blur-xl"
                >
                  <ul className="flex flex-col">
                    {navIndex.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleNavSelect(item.page)}
                          className="w-full rounded-lg px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <button
        type="button"
        onClick={scrollToTop}
        aria-label="맨 위로 가기"
        className="fixed right-6 bottom-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-chip text-[#1d1d1f] backdrop-blur-md transition-transform hover:scale-95"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M8 3L3 8.5M8 3L13 8.5M8 3V13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => {
          setShowAdminModal(true);
          setAdminError("");
        }}
        className="fixed bottom-6 left-6 z-50 text-xs text-white opacity-20 transition-opacity hover:opacity-40"
      >
        admin
      </button>

      {isAdmin && (
        <section className="fixed top-20 right-6 left-6 z-40 mx-auto max-w-3xl rounded-2xl bg-black/50 p-6 text-white backdrop-blur-md">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-[21px] font-semibold tracking-tight">
              관리자 패널
            </h2>
            <button
              type="button"
              onClick={() => setIsAdmin(false)}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition-transform hover:scale-95"
            >
              로그아웃
            </button>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              type="text"
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder="목차 라벨"
              className="h-11 rounded-full border border-white/10 bg-black/40 px-5 text-sm text-white outline-none placeholder:text-white/40 focus-visible:outline-2 focus-visible:outline-action-focus"
            />
            <input
              type="number"
              min={1}
              max={119}
              value={newPage}
              onChange={(event) => setNewPage(event.target.value)}
              placeholder="이미지 번호"
              className="h-11 rounded-full border border-white/10 bg-black/40 px-5 text-sm text-white outline-none placeholder:text-white/40 focus-visible:outline-2 focus-visible:outline-action-focus"
            />
            <button
              type="button"
              onClick={addNavItem}
              className="h-11 rounded-full bg-action px-6 text-sm text-white transition-transform hover:scale-95"
            >
              추가
            </button>
          </div>

          <ul className="space-y-3">
            {navIndex.length === 0 ? (
              <li className="rounded-2xl bg-black/40 px-4 py-6 text-center text-sm text-white/60">
                등록된 목차가 없습니다.
              </li>
            ) : (
              navIndex.map((item, index) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl bg-black/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.label}</p>
                    <p className="truncate text-sm text-white/60">
                      {item.page}번 이미지
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => moveNavUp(index)}
                      disabled={index === 0}
                      className="rounded-full border border-white/10 px-3 py-2 text-sm transition-transform hover:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      위로
                    </button>
                    <button
                      type="button"
                      onClick={() => moveNavDown(index)}
                      disabled={index === navIndex.length - 1}
                      className="rounded-full border border-white/10 px-3 py-2 text-sm transition-transform hover:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      아래로
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNavItem(item.id)}
                      className="rounded-full bg-action px-3 py-2 text-sm text-white transition-transform hover:scale-95"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      )}

      <main className="fixed inset-0 z-0 bg-[#171717]">
        <VirtualPortfolioList
          ref={listRef}
          className="h-full w-full bg-[#171717]"
        />
      </main>

      {showAdminModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
            className="w-full max-w-sm rounded-2xl bg-black/50 p-6 text-white backdrop-blur-md"
          >
            <h3
              id="admin-modal-title"
              className="text-[21px] font-semibold tracking-tight"
            >
              관리자 로그인
            </h3>
            <p className="mt-2 text-sm text-white/70">
              관리자 암호를 입력해 주세요.
            </p>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleAdminLogin();
              }}
              placeholder="암호"
              className="mt-4 h-11 w-full rounded-full border border-white/10 bg-black/40 px-5 text-sm text-white outline-none placeholder:text-white/40 focus-visible:outline-2 focus-visible:outline-action-focus"
              autoFocus
            />
            {adminError && (
              <p className="mt-2 text-sm text-action">{adminError}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAdminModal(false);
                  setPassword("");
                  setAdminError("");
                }}
                className="rounded-full border border-white/10 px-5 py-2.5 text-sm transition-transform hover:scale-95"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAdminLogin}
                className="rounded-full bg-action px-5 py-2.5 text-sm text-white transition-transform hover:scale-95"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
