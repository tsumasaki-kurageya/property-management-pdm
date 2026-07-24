import { useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { explorerAreasById, explorerGraph, explorerNodesById } from '../../data/explorer';
import './BusinessAreaMap.css';

interface BusinessAreaMapProps {
  onSelectBusiness: (businessId: string) => void;
}

const businessAreas = [...explorerGraph.businessAreas].sort((left, right) => left.order - right.order);

function containsNextFocus(event: FocusEvent<HTMLElement>): boolean {
  return event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget);
}

export default function BusinessAreaMap({ onSelectBusiness }: BusinessAreaMapProps) {
  const [expandedAreaId, setExpandedAreaId] = useState<string>();
  const mapRef = useRef<HTMLElement>(null);
  const pointerInteractionRef = useRef(false);
  const expandedArea = expandedAreaId ? explorerAreasById.get(expandedAreaId) : undefined;

  const closeExpandedArea = () => setExpandedAreaId(undefined);

  const handleMapPointerLeave = () => {
    if (window.matchMedia('(hover: hover)').matches) closeExpandedArea();
  };

  const openAreaAndFocusFirstBusiness = (areaId: string) => {
    setExpandedAreaId(areaId);
    window.requestAnimationFrame(() => {
      mapRef.current?.querySelector<HTMLButtonElement>(`[data-map-business-area-id="${areaId}"]`)?.focus();
    });
  };

  const handleMapBlur = (event: FocusEvent<HTMLElement>) => {
    if (!containsNextFocus(event)) closeExpandedArea();
  };

  const handleMapKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || !expandedAreaId) return;
    event.preventDefault();
    const areaId = expandedAreaId;
    closeExpandedArea();
    window.requestAnimationFrame(() => {
      mapRef.current?.querySelector<HTMLButtonElement>(`[data-business-area-id="${areaId}"]`)?.focus();
    });
  };

  return (
    <main
      ref={mapRef}
      className="business-area-map"
      aria-labelledby="business-area-map-title"
      onMouseLeave={handleMapPointerLeave}
      onBlur={handleMapBlur}
      onKeyDown={handleMapKeyDown}
    >
      <header className="business-area-map-heading">
        <div>
          <p className="business-area-map-kicker">全体の業務地図</p>
          <h2 id="business-area-map-title">18業務領域から業務を探す</h2>
          <p>業務領域を開き、所属する業務を選択してください。</p>
        </div>
        <div className="business-area-map-summary" aria-label={`業務領域18件、業務${explorerGraph.businessIndex.length}件`}>
          <span><strong>18</strong> 業務領域</span>
          <span><strong>{explorerGraph.businessIndex.length}</strong> 業務</span>
        </div>
      </header>

      <div className="business-area-map-layout">
        <div className="business-area-grid" aria-label="18の業務領域">
          {businessAreas.map((area) => {
            const isExpanded = area.id === expandedAreaId;
            return (
              <button
                key={area.id}
                type="button"
                data-business-area-id={area.id}
                className={`business-area-node${isExpanded ? ' is-expanded' : ''}`}
                aria-expanded={isExpanded}
                aria-controls="business-area-expansion"
                aria-label={`${area.id} 業務領域「${area.label}」、所属業務${area.businessIds.length}件。所属業務を${isExpanded ? '閉じる' : '開く'}`}
                onMouseEnter={() => {
                  if (window.matchMedia('(hover: hover)').matches) setExpandedAreaId(area.id);
                }}
                onPointerDown={() => {
                  pointerInteractionRef.current = true;
                }}
                onPointerUp={() => {
                  window.setTimeout(() => {
                    pointerInteractionRef.current = false;
                  }, 0);
                }}
                onPointerCancel={() => {
                  pointerInteractionRef.current = false;
                }}
                onFocus={() => {
                  if (!pointerInteractionRef.current) setExpandedAreaId(area.id);
                }}
                onClick={() => {
                  setExpandedAreaId((currentAreaId) => currentAreaId === area.id ? undefined : area.id);
                  pointerInteractionRef.current = false;
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowDown') return;
                  event.preventDefault();
                  openAreaAndFocusFirstBusiness(area.id);
                }}
              >
                <span className="business-area-node-id">{area.id}</span>
                <strong>{area.label}</strong>
                <span className="business-area-node-count">{area.businessIds.length}業務</span>
                <span className="business-area-node-action" aria-hidden="true">
                  {isExpanded ? '展開中' : '所属業務を見る'}
                </span>
              </button>
            );
          })}
        </div>

        <section
          id="business-area-expansion"
          className={`business-area-expansion${expandedArea ? ' has-area' : ''}`}
          aria-label="所属業務"
        >
          {expandedArea ? (
            <>
              <header>
                <div>
                  <span>{expandedArea.id} の所属業務</span>
                  <h3>{expandedArea.label}</h3>
                  <p>{expandedArea.businessIds.length}件すべてを表示しています。</p>
                </div>
                <button type="button" className="business-area-close" onClick={closeExpandedArea}>
                  閉じる
                </button>
              </header>
              <div className="business-node-list">
                {expandedArea.businessIds.map((businessId) => {
                  const business = explorerNodesById.get(businessId);
                  if (!business) return null;
                  return (
                    <button
                      key={business.id}
                      type="button"
                      data-map-business-area-id={expandedArea.id}
                      className="business-map-node"
                      aria-label={`業務 ${business.id} ${business.label} を選択`}
                      onClick={() => onSelectBusiness(business.id)}
                    >
                      <span>{business.id}</span>
                      <strong>{business.label}</strong>
                      <span className="business-map-node-action" aria-hidden="true">選択</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="business-area-map-guide">
              <span aria-hidden="true">18</span>
              <h3>業務領域を開く</h3>
              <p>マウスを重ねる、Tabキーでフォーカスする、またはタップすると、ここに所属業務が全件表示されます。</p>
              <small>業務領域は分類です。選択できるのは展開後の業務ノードです。</small>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
