// Light-theme skeleton placeholders
function SkeletonBlock({ width, height, radius = 10 }: { width: string | number; height: string | number; radius?: number }) {
    return (
        <div
            className="skeleton"
            style={{ width, height, borderRadius: radius, flexShrink: 0 }}
        />
    );
}

export function PortraitSkeleton() {
    return (
        <div style={{ flexShrink: 0 }}>
            <SkeletonBlock width={140} height={210} radius={12} />
        </div>
    );
}

export function LandscapeSkeleton() {
    return (
        <div style={{ flexShrink: 0 }}>
            <SkeletonBlock width={260} height={146} radius={12} />
        </div>
    );
}

export function RowSkeleton({ portrait = true }: { portrait?: boolean }) {
    return (
        <div className="home-section">
            <SkeletonBlock width={140} height={20} radius={6} />
            <div className="section-row" style={{ marginTop: 14 }}>
                {Array.from({ length: 6 }).map((_, i) =>
                    portrait ? <PortraitSkeleton key={i} /> : <LandscapeSkeleton key={i} />
                )}
            </div>
        </div>
    );
}

// Legacy compat exports
export const HeroSkeleton = () => null;
export const PosterSkeleton = PortraitSkeleton;
