export interface Feature {
    id: string;
    name: string;
    icon: string;
    order: number;
    render(container: HTMLElement): void;
    init?(): Promise<void>;
    destroy?(): void;
}
