"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { gsap } from 'gsap';
import { FiUser, FiLogIn, FiX } from 'react-icons/fi';
import './PillNav.css';

export type PillNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
};

export interface PillNavProps {
  logo: string;
  logoAlt?: string;
  items: PillNavItem[];
  activeHref?: string;
  className?: string;
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  onMobileMenuClick?: () => void;
  initialLoadAnimation?: boolean;
}

const PillNav: React.FC<PillNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  activeHref,
  className = '',
  ease = 'power3.easeOut',
  baseColor = '#ffffff',
  pillColor = '#ff6b35',
  hoveredPillTextColor = '#ffffff',
  pillTextColor,
  onMobileMenuClick,
  initialLoadAnimation = true
}) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const resolvedPillTextColor = pillTextColor ?? baseColor;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const circleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tlRefs = useRef<Array<gsap.core.Timeline | null>>([]);
  const activeTweenRefs = useRef<Array<gsap.core.Tween | null>>([]);
  // Removed unused logo refs
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLAnchorElement | HTMLElement | null>(null);

  // Use pathname if activeHref is not provided
  const currentActiveHref = activeHref ?? pathname;

  // Note: Previous GSAP circle animation logic removed for a cleaner CSS-based pill effect.
  // The handleEnter and handleLeave functions are no longer needed for complex animations.

  useEffect(() => {
    // Initial load animations kept
    const menu = mobileMenuRef.current;
    if (menu) {
      gsap.set(menu, { visibility: 'hidden', scaleY: 1 });
    }

    if (initialLoadAnimation) {
      const logo = logoRef.current;
      const navItems = navItemsRef.current;

      if (logo) {
        gsap.set(logo, { scale: 0 });
        gsap.to(logo, {
          scale: 1,
          duration: 0.6,
          ease
        });
      }

      if (navItems) {
        gsap.set(navItems, { width: 0, overflow: 'hidden' });
        gsap.to(navItems, {
          width: 'auto',
          duration: 0.6,
          ease
        });
      }
    }

    // Cleanup function if needed (though we only animate on mount)
    return () => { };
  }, [ease, initialLoadAnimation]);


  const backdropRef = useRef<HTMLDivElement | null>(null);

  // Auto-close mobile menu when pathname changes (user navigates)
  useEffect(() => {
    // Only close if menu is open AND pathname has actually changed
    // We use a ref to track if this is the initial render
    const handlePathnameChange = () => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        const hamburger = hamburgerRef.current;
        const menu = mobileMenuRef.current;
        const backdrop = backdropRef.current;

        if (hamburger) {
          const lines = hamburger.querySelectorAll('.hamburger-line');
          gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
          gsap.to(lines[1], { rotation: 0, x: 0, opacity: 1, duration: 0.3, ease }); // Reset middle line
          gsap.to(lines[2], { rotation: 0, y: 0, duration: 0.3, ease });
        }

        if (menu) {
          gsap.to(menu, {
            x: '100%', // Slide out to right
            duration: 0.4,
            ease: 'power3.inOut',
            onComplete: () => {
              gsap.set(menu, { visibility: 'hidden' });
            }
          });
        }

        if (backdrop) {
          gsap.to(backdrop, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
              gsap.set(backdrop, { visibility: 'hidden' });
            }
          });
        }
      }
    };

    // Create a small delay to prevent immediate closing on mount
    const timeoutId = setTimeout(handlePathnameChange, 100);
    return () => clearTimeout(timeoutId);
  }, [pathname]); // Remove isMobileMenuOpen from dependencies

  // Simplified handlers - primarily for state or future use if needed, 
  // but for now CSS handles the visual hover.
  const handleEnter = (i: number) => { };
  const handleLeave = (i: number) => { };

  // handleLogoEnter removed for CSS hover effect

  const closeMobileMenu = () => {
    if (!isMobileMenuOpen) return;

    setIsMobileMenuOpen(false);

    const hamburger = hamburgerRef.current;
    const menu = mobileMenuRef.current;
    const backdrop = backdropRef.current;

    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line');
      gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
      gsap.to(lines[1], { rotation: 0, x: 0, opacity: 1, duration: 0.3, ease });
      gsap.to(lines[2], { rotation: 0, y: 0, duration: 0.3, ease });
    }

    if (menu) {
      gsap.to(menu, {
        x: '100%',
        duration: 0.4,
        ease: 'power3.inOut',
        onComplete: () => {
          gsap.set(menu, { visibility: 'hidden' });
        }
      });
    }

    if (backdrop) {
      gsap.to(backdrop, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.inOut',
        onComplete: () => {
          gsap.set(backdrop, { visibility: 'hidden' });
        }
      });
    }
  };

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
      return;
    }

    setIsMobileMenuOpen(true);

    const hamburger = hamburgerRef.current;
    const menu = mobileMenuRef.current;
    const backdrop = backdropRef.current;

    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line');
      // Animate to X
      gsap.to(lines[0], { rotation: 45, y: 7, duration: 0.3, ease });
      gsap.to(lines[1], { opacity: 0, x: -10, duration: 0.3, ease });
      gsap.to(lines[2], { rotation: -45, y: -7, duration: 0.3, ease });
    }

    if (menu && backdrop) {
      // Open
      gsap.set(menu, { visibility: 'visible', x: '100%', opacity: 1 });
      gsap.set(backdrop, { visibility: 'visible', opacity: 0 });

      gsap.to(menu, {
        x: '0%',
        duration: 0.5,
        ease: 'power3.out'
      });

      gsap.to(backdrop, {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out'
      });
    }

    onMobileMenuClick?.();
  };

  const isExternalLink = (href: string) =>
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#');

  const cssVars = {
    ['--base']: baseColor,
    ['--pill-bg']: pillColor,
    ['--hover-text']: hoveredPillTextColor,
    ['--pill-text']: resolvedPillTextColor
  } as React.CSSProperties;

  return (
    <div className="pill-nav-container">
      <nav className={`pill-nav ${className}`} aria-label="Primary" style={cssVars}>
        <Link
          className="pill-logo"
          href="/"
          aria-label="Home"
          onMouseEnter={undefined}
          ref={el => {
            logoRef.current = el;
          }}
        >
          <Image
            src={logo}
            alt={logoAlt}
            width={200}
            height={115}
            className="pill-logo-image"
            priority
          />
        </Link>

        <div className="pill-nav-items desktop-only" ref={navItemsRef}>
          <ul className="pill-list" role="menubar">
            {items.map((item, i) => (
              <li key={item.href} role="none">
                {isExternalLink(item.href) ? (
                  <a
                    role="menuitem"
                    href={item.href}
                    className={`pill${currentActiveHref === item.href ? ' is-active' : ''}`}
                    aria-label={item.ariaLabel || item.label}
                    onMouseEnter={() => handleEnter(i)}
                    onMouseLeave={() => handleLeave(i)}
                  >
                    <span
                      className="hover-circle"
                      aria-hidden="true"
                      ref={el => {
                        circleRefs.current[i] = el;
                      }}
                    />
                    <span className="label-stack">
                      <span className="pill-label">{item.label}</span>
                      <span className="pill-label-hover" aria-hidden="true">
                        {item.label}
                      </span>
                    </span>
                  </a>
                ) : (
                  <Link
                    role="menuitem"
                    href={item.href}
                    className={`pill${currentActiveHref === item.href ? ' is-active' : ''}`}
                    aria-label={item.ariaLabel || item.label}
                    onMouseEnter={() => handleEnter(i)}
                    onMouseLeave={() => handleLeave(i)}
                  >
                    <span
                      className="hover-circle"
                      aria-hidden="true"
                      ref={el => {
                        circleRefs.current[i] = el;
                      }}
                    />
                    <span className="label-stack">
                      <span className="pill-label">{item.label}</span>
                      <span className="pill-label-hover" aria-hidden="true">
                        {item.label}
                      </span>
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Profile/Auth Section */}
        <div className="pill-auth-section desktop-only">
          {session?.user ? (
            <Link href="/profile" className="pill-profile-link">
              <div className="pill-profile-avatar">
                <FiUser className="pill-profile-icon" size={18} />
              </div>
              <div className="pill-profile-info">
                <span className="pill-profile-name">{session.user.name}</span>
                <span className="pill-profile-label">View Profile</span>
              </div>
            </Link>
          ) : (
            <Link href="/login" className="pill-login-button">
              <FiLogIn size={18} />
              <span>Login / Register</span>
            </Link>
          )}
        </div>

        <button
          className="mobile-menu-button mobile-only"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          ref={hamburgerRef}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </nav>

      <div
        className="mobile-menu-backdrop mobile-only"
        ref={backdropRef}
        onClick={closeMobileMenu}
      />

      <div className="mobile-menu-popover mobile-only" ref={mobileMenuRef} style={cssVars}>
        {/* Close Button Inside Menu */}
        <button
          className="mobile-menu-close-btn"
          onClick={closeMobileMenu}
          aria-label="Close menu"
        >
          <FiX size={24} />
        </button>

        <ul className="mobile-menu-list">
          {items.map(item => (
            <li key={item.href}>
              {isExternalLink(item.href) ? (
                <a
                  href={item.href}
                  className={`mobile-menu-link${currentActiveHref === item.href ? ' is-active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  href={item.href}
                  className={`mobile-menu-link${currentActiveHref === item.href ? ' is-active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
          {/* Mobile Auth Section */}
          <li className="mobile-auth-item">
            {session?.user ? (
              <Link
                href="/profile"
                className="mobile-menu-link"
                onClick={closeMobileMenu}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <FiUser className="text-white" size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">{session.user.name}</div>
                    <div className="text-gray-400 text-sm">View Profile</div>
                  </div>
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                className="mobile-menu-link mobile-login-button"
                onClick={closeMobileMenu}
              >
                <FiLogIn size={20} />
                <span>Login / Register</span>
              </Link>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PillNav;

