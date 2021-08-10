import { RefObject, useCallback, useEffect, useState } from 'react';

function useElementWidth(elementRef: RefObject<HTMLElement>) {
  const [width, setWidth] = useState<number>(0);
  const handleResize = useCallback(() => setWidth(elementRef?.current?.getBoundingClientRect().width!), [elementRef]);

  useEffect(() => {
    if (typeof window !== 'undefined' && elementRef.current) {
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return width;
}

export default useElementWidth;
