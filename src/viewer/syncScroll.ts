export function syncScroll(oldPane: HTMLElement, newPane: HTMLElement): () => void {
  let syncing = false;

  const bind = (source: HTMLElement, target: HTMLElement) => {
    const onScroll = () => {
      if (syncing) return;
      syncing = true;
      target.scrollTop = source.scrollTop;
      target.scrollLeft = source.scrollLeft;
      requestAnimationFrame(() => {
        syncing = false;
      });
    };
    source.addEventListener('scroll', onScroll);
    return () => source.removeEventListener('scroll', onScroll);
  };

  const disposeOld = bind(oldPane, newPane);
  const disposeNew = bind(newPane, oldPane);

  return () => {
    disposeOld();
    disposeNew();
  };
}
