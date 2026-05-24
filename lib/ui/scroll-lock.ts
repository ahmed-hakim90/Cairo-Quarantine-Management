/** Lock document scroll (iOS-safe) while overlays are open. */
export function lockDocumentScroll(): () => void {
  const scrollY = window.scrollY;
  const { style: htmlStyle } = document.documentElement;
  const { style: bodyStyle } = document.body;

  const prevHtmlOverflow = htmlStyle.overflow;
  const prevBodyOverflow = bodyStyle.overflow;
  const prevBodyPosition = bodyStyle.position;
  const prevBodyTop = bodyStyle.top;
  const prevBodyWidth = bodyStyle.width;

  htmlStyle.overflow = "hidden";
  bodyStyle.overflow = "hidden";
  bodyStyle.position = "fixed";
  bodyStyle.top = `-${scrollY}px`;
  bodyStyle.width = "100%";

  return () => {
    htmlStyle.overflow = prevHtmlOverflow;
    bodyStyle.overflow = prevBodyOverflow;
    bodyStyle.position = prevBodyPosition;
    bodyStyle.top = prevBodyTop;
    bodyStyle.width = prevBodyWidth;
    window.scrollTo(0, scrollY);
  };
}
