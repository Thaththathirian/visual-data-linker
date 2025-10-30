
import React, { useMemo, useRef, useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { readIntelliPartsFromLocal, groupIntelliPartsByCategory } from "@/utils/intelliPartsReader";
import { createPortal } from "react-dom";

const CLOSE_DELAY_MS = 220;

const Navigation: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [isOpen, setIsOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [activeSub, setActiveSub] = useState<string | null>(null);
	const [flyoutLeft, setFlyoutLeft] = useState(false);
	const [flyout, setFlyout] = useState<{
		top: number;
		left: number;
		items: string[];
		category: string;
		sub: string;
	} | null>(null);
	const [isPinned, setIsPinned] = useState(false);
	const closeTimerRef = useRef<number | null>(null);
	const navRef = useRef<HTMLDivElement>(null);
	const flyoutRef = useRef<HTMLDivElement>(null);
	const flyoutScrollRef = useRef<HTMLDivElement>(null);
	const [showScrollUp, setShowScrollUp] = useState(false);
	const [showScrollDown, setShowScrollDown] = useState(false);

	const { data: items } = useQuery({ queryKey: ["intelliPartsDataNav"], queryFn: readIntelliPartsFromLocal });
	const categories = useMemo(() => (items ? groupIntelliPartsByCategory(items) : []), [items]);

	// Derive current category from URL (?category=... or catpath=Cat>Sub>...)
	const currentCategoryFromUrl = useMemo(() => {
		const sp = new URLSearchParams(location.search);
		const catPath = sp.get("catpath") || "";
		if (catPath) return catPath.split(">")[0].trim();
		return sp.get("category") || "";
	}, [location.search]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			const inNav = navRef.current?.contains(e.target as Node);
			const inFly = flyoutRef.current?.contains(e.target as Node);
			if (!inNav && !inFly) {
				closeMenus();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const updateFlyoutScrollButtons = () => {
		const c = flyoutScrollRef.current;
		if (!c) { setShowScrollUp(false); setShowScrollDown(false); return; }
		setShowScrollUp(c.scrollTop > 0);
		setShowScrollDown(c.scrollTop + c.clientHeight < c.scrollHeight);
	};

	useEffect(() => {
		if (!flyout) { setShowScrollUp(false); setShowScrollDown(false); return; }
		// allow DOM paint then compute
		requestAnimationFrame(updateFlyoutScrollButtons);
	}, [flyout]);

	const closeMenus = () => {
		setActiveIndex(null);
		setActiveSub(null);
		setFlyout(null);
		setIsPinned(false);
		setIsOpen(false);
	};

	const clearCloseTimer = () => {
		if (closeTimerRef.current) {
			window.clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}
	};
	const scheduleClose = () => {
		if (isPinned) return; // don't close when pinned
		clearCloseTimer();
		closeTimerRef.current = window.setTimeout(() => {
			setActiveIndex(null);
			setActiveSub(null);
			setFlyout(null);
		}, CLOSE_DELAY_MS);
	};

	const openCategory = (category: string) => {
		setIsPinned(true);
		navigate(`/?${new URLSearchParams({ category, catpath: category }).toString()}`);
	};
	const openSubcategory = (category: string, sub: string) => {
		setIsPinned(true);
		navigate(`/?${new URLSearchParams({ category, subcategory: sub, catpath: `${category}>${sub}` }).toString()}`);
	};
	const openMachine = (category: string, sub: string, machine: string) => {
		// Last level selection: try to navigate directly to coordinates page for first matching product
		const firstProduct = (items || []).find(it => it.category === category && it.sub_category === sub && it.machine_name === machine && it.sparepartspage_path);
		if (firstProduct && firstProduct.sparepartspage_path) {
			closeMenus();
			const query = new URLSearchParams({
				category: firstProduct.category || '',
				subcategory: firstProduct.sub_category || '',
				machine: firstProduct.machine_name || '',
				name: firstProduct.sparepartspage_name || '',
				brand: firstProduct.brand || ''
			}).toString();
			navigate(`/${encodeURIComponent(firstProduct.sparepartspage_path)}?${query}`);
			return;
		}
		// Fallback to category/subcategory/machine listing
		setIsPinned(false);
		closeMenus();
		navigate(`/?${new URLSearchParams({ category, subcategory: sub, machine, catpath: `${category}>${sub}>${machine}` }).toString()}`);
	};

	const navigateToFirstProductForSub = (category: string, sub: string): boolean => {
		const firstProduct = (items || []).find(it => it.category === category && it.sub_category === sub && it.sparepartspage_path);
		if (firstProduct && firstProduct.sparepartspage_path) {
			closeMenus();
			const query = new URLSearchParams({
				category: firstProduct.category || '',
				subcategory: firstProduct.sub_category || '',
				machine: firstProduct.machine_name || '',
				name: firstProduct.sparepartspage_name || '',
				brand: firstProduct.brand || ''
			}).toString();
			navigate(`/${encodeURIComponent(firstProduct.sparepartspage_path)}?${query}`);
			return true;
		}
		return false;
	};

	const getMachinesFor = (category: string, sub: string): string[] => {
		if (!items) return [];
		const s = new Set<string>();
		for (const it of items) {
			if (it.category === category && it.sub_category === sub && it.machine_name) s.add(it.machine_name);
		}
		return Array.from(s);
	};

	return (
		<nav className="bg-[#1d67cdb3] text-white text-sm">
			<div className="container mx-auto px-4" ref={navRef}>
				<div className="flex items-center justify-between p-2 md:hidden">
					<span className="font-semibold">Menu</span>
					<button onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
				</div>

				<div className="hidden md:flex">
					<ul className="flex flex-wrap">
						{categories.map((cat, index) => {
							const isUrlActive = currentCategoryFromUrl && cat.name === currentCategoryFromUrl;
							const isHoverActive = activeIndex === index;
							return (
								<li key={cat.name} className="relative group">
									<button
										className={`px-3 py-2 transition-colors duration-200 flex items-center gap-1 ${isUrlActive || isHoverActive ? 'bg-custom-blue/60' : 'hover:bg-custom-blue'}`}
										onMouseEnter={() => { clearCloseTimer(); setActiveIndex(index); setActiveSub(null); setFlyout(null); setIsPinned(false); }}
										onMouseLeave={scheduleClose}
										onClick={() => {
											// Toggle: if this menu already open, close; else open (no navigation)
											if (activeIndex === index) { closeMenus(); }
											else { clearCloseTimer(); setActiveIndex(index); setActiveSub(null); setFlyout(null); setIsPinned(false); }
										}}
									>
										<span className="whitespace-nowrap">{cat.name}</span>
										<ChevronDown className="h-3.5 w-3.5 opacity-80" />
									</button>
									{activeIndex === index && (cat.subcategories?.length > 0 || cat.machines?.length > 0) ? (
										<div
											className="absolute left-0 mt-0 w-72 bg-white text-gray-900 shadow-lg z-50 overflow-visible"
											onMouseEnter={clearCloseTimer}
											onMouseLeave={scheduleClose}
										>
											<div className="max-h-[60vh] overflow-y-auto overflow-x-visible">
												<ul className="py-1">
													{(cat.subcategories && cat.subcategories.length > 0 ? cat.subcategories : cat.machines || []).map((label: string) => {
														const machines = cat.subcategories && cat.subcategories.length > 0 ? getMachinesFor(cat.name, label) : [];
														const isActive = activeSub === label;
														return (
															<li key={label} className="relative">
																<button
																	className={`block w-full text-left px-3 py-1 flex items-center justify-between transition-colors ${isActive ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500' : 'hover:bg-blue-50'}`}
																	onMouseEnter={(e) => {
																	clearCloseTimer();
																	setActiveSub(label);
																	const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
																	const width = 256;
																	const rightSpace = window.innerWidth - rect.right;
																	const leftSpace = rect.left;
																	const useLeft = rightSpace < width && leftSpace > rightSpace;
																	setFlyoutLeft(useLeft);
																	const left = useLeft ? rect.left - width - 8 : rect.right + 8;
																	const top = Math.max(8, Math.min(window.innerHeight - 8, rect.top));
																	setFlyout(machines.length > 0 ? { top, left, items: machines, category: cat.name, sub: label } : null);
																}}
																onMouseLeave={scheduleClose}
																onClick={() => {
																	if (cat.subcategories && cat.subcategories.length > 0) {
																		// We are clicking a subcategory label
																		if (machines.length === 0) {
																			if (!navigateToFirstProductForSub(cat.name, label)) {
																				openSubcategory(cat.name, label);
																			}
																		} else {
																			openSubcategory(cat.name, label);
																		}
																	} else {
																		// No subcategories: labels are machines; open coordinates directly
																		openMachine(cat.name, '', label);
																	}
															}}
														>
																<span className="truncate">{label}</span>
																{machines.length > 0 ? <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg] opacity-70" /> : null}
														</button>
														</li>
													);
												})}
											</ul>
										</div>
									</div>
								) : null}
							</li>
						);
						})}
					</ul>
				</div>

				{isOpen ? (
					<div className="md:hidden">
						<ul className="bg-custom-blue">
							{categories.map((cat) => (
								<li key={cat.name} className="border-b border-custom-blue">
									<button className="w-full text-left px-3 py-2" onClick={() => openCategory(cat.name)}>
										{cat.name}
									</button>
								</li>
							))}
						</ul>
					</div>
				) : null}
			</div>

			{/* Portal flyout for second-level to avoid clipping/scroll */}
			{flyout && createPortal(
				<div
					ref={flyoutRef}
					className="fixed z-[1000] w-64 bg-white text-gray-900 shadow-lg border border-gray-100"
					style={{ top: flyout.top, left: flyout.left, maxHeight: `calc(100vh - ${flyout.top + 8}px)` }}
					onMouseEnter={() => { clearCloseTimer(); updateFlyoutScrollButtons(); }}
					onMouseLeave={scheduleClose}
				>
					<div ref={flyoutScrollRef} className="relative max-h-[40vh] overflow-y-scroll" onScroll={updateFlyoutScrollButtons}>
						<ul className="py-1">
							{flyout.items.map((m) => (
								<li key={m}>
									<button className="block w-full text-left px-3 py-1 hover:bg-blue-50" onClick={() => openMachine(flyout.category, flyout.sub, m)}>
										{m}
									</button>
								</li>
							))}
						</ul>
						{/* Scroll controls */}
						{showScrollUp && (
							<button
								type="button"
								className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white/90 to-transparent text-gray-600 text-xs"
								onClick={() => { const c = flyoutScrollRef.current; if (c) { c.scrollBy({ top: -120, behavior: 'smooth' }); }}}
							>
								▲
							</button>
						)}
						{showScrollDown && (
							<button
								type="button"
								className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white/90 to-transparent text-gray-600 text-xs"
								onClick={() => { const c = flyoutScrollRef.current; if (c) { c.scrollBy({ top: 120, behavior: 'smooth' }); }}}
							>
								▼
							</button>
						)}
					</div>
				</div>,
				document.body
			)}
		</nav>
	);
};

export default Navigation;
