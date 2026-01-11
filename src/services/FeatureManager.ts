import type { Feature } from '../features/types';

export class FeatureManager {
    private static instance: FeatureManager;
    private features: Map<string, Feature> = new Map();
    private activeFeature: Feature | null = null;
    private container: HTMLElement | null = null;

    private constructor() { }

    static getInstance(): FeatureManager {
        if (!FeatureManager.instance) {
            FeatureManager.instance = new FeatureManager();
        }
        return FeatureManager.instance;
    }

    setContainer(container: HTMLElement) {
        this.container = container;
    }

    register(feature: Feature) {
        this.features.set(feature.id, feature);
    }

    getAllFeatures(): Feature[] {
        return Array.from(this.features.values()).sort((a, b) => a.order - b.order);
    }

    async activate(featureId: string) {
        const feature = this.features.get(featureId);
        if (!feature || !this.container) return;

        if (this.activeFeature && this.activeFeature.destroy) {
            this.activeFeature.destroy();
        }

        this.activeFeature = feature;
        this.container.innerHTML = ''; // Clear container
        feature.render(this.container);

        if (feature.init) {
            await feature.init();
        }

        // Dispatch event for UI updates (e.g. sidebar highlight)
        window.dispatchEvent(new CustomEvent('feature-activated', { detail: { featureId } }));
    }
}
