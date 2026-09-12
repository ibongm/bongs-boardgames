export default function BuildPicker({
  selectedElement,
  onConfirmBuildRoad,
  onConfirmBuildSettlement,
  onConfirmBuildCity,
  onConfirmSetupPlacement,
  onCancel,
  isSetup = false,
  freeRoads = 0,
}) {
  if (!selectedElement) return null;

  const { type, id, legal, isCityUpgrade } = selectedElement;

  return (
    <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto paper-card border border-gold/30 rounded-3xl p-4 shadow-xl max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display text-base font-bold text-ink">
            {type === 'path'
              ? 'Road Construction'
              : isCityUpgrade
              ? 'City Expansion'
              : 'New Settlement'}
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="text-ink/40 hover:text-ink text-sm px-2 py-1"
          >
            ✕
          </button>
        </div>

        {type === 'path' && (
          <div>
            <p className="text-xs text-ink/75 mb-3">
              {freeRoads > 0
                ? 'Place free road from Road Building Breakthrough.'
                : 'Construct a road segment connecting to your existing network (Cost: 1 Wood, 1 Clay).'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onConfirmBuildRoad(id)}
                disabled={!legal}
                className="flex-1 btn btn-primary py-2.5 text-sm min-h-11 disabled:opacity-40"
              >
                {freeRoads > 0 ? 'Place Free Road' : 'Confirm Road'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-ghost py-2.5 text-sm min-h-11"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {type === 'intersection' && (
          <div>
            <p className="text-xs text-ink/75 mb-3">
              {isSetup
                ? 'Select a connected road segment next to complete your starter placement.'
                : isCityUpgrade
                ? 'Upgrade this settlement to a walled city (Cost: 3 Stone, 2 Wheat). Produces double resources!'
                : 'Build a settlement obeying the spacing rule (Cost: 1 Wood, 1 Clay, 1 Sheep, 1 Wheat).'}
            </p>
            <div className="flex gap-2">
              {isCityUpgrade ? (
                <button
                  type="button"
                  onClick={() => onConfirmBuildCity(id)}
                  disabled={!legal}
                  className="flex-1 btn btn-primary py-2.5 text-sm min-h-11 disabled:opacity-40"
                >
                  Upgrade to City
                </button>
              ) : isSetup ? (
                <button
                  type="button"
                  onClick={() => onConfirmSetupPlacement(id)}
                  disabled={!legal}
                  className="flex-1 btn btn-primary py-2.5 text-sm min-h-11 disabled:opacity-40"
                >
                  Confirm Settlement
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onConfirmBuildSettlement(id)}
                  disabled={!legal}
                  className="flex-1 btn btn-primary py-2.5 text-sm min-h-11 disabled:opacity-40"
                >
                  Confirm Settlement
                </button>
              )}
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-ghost py-2.5 text-sm min-h-11"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
