"use client";

import { useLenis } from "lenis/react";

/**
 * Custom hook to access the Lenis smooth scroll instance
 *
 * @example
 * ```tsx
 * const lenis = useLenisScroll();
 *
 * // Scroll to element
 * lenis?.scrollTo('#section-id');
 *
 * // Scroll to top
 * lenis?.scrollTo(0);
 *
 * // Stop scrolling
 * lenis?.stop();
 *
 * // Start scrolling
 * lenis?.start();
 * ```
 */
export function useLenisScroll() {
  return useLenis();
}

/**
 * Utility functions for common scroll operations
 */
export const scrollUtils = {
  /**
   * Scroll to the top of the page
   */
  scrollToTop: (lenis: any) => {
    lenis?.scrollTo(0, { duration: 1.5 });
  },

  /**
   * Scroll to a specific element
   */
  scrollToElement: (lenis: any, selector: string, offset = 0) => {
    lenis?.scrollTo(selector, { offset, duration: 1.5 });
  },

  /**
   * Scroll by a specific amount
   */
  scrollBy: (lenis: any, distance: number) => {
    lenis?.scrollTo(window.scrollY + distance, { duration: 1 });
  },

  /**
   * Stop smooth scrolling
   */
  stop: (lenis: any) => {
    lenis?.stop();
  },

  /**
   * Resume smooth scrolling
   */
  start: (lenis: any) => {
    lenis?.start();
  },
};
