"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { getNextSegment, type SegmentResult } from "@/lib/resource-library";

type ContentDeliveryState = {
    activeResourceId: string | null;
    lastSegment: SegmentResult | null;
    isDelivering: boolean;
};

type ContentDeliveryContextValue = ContentDeliveryState & {
    setActiveResource: (resourceId: string | null) => void;
    deliverNextSegment: () => Promise<SegmentResult | null>;
    clearDelivery: () => void;
};

const ContentDeliveryContext = createContext<ContentDeliveryContextValue | null>(null);

export const ContentDeliveryProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<ContentDeliveryState>({
        activeResourceId: null,
        lastSegment: null,
        isDelivering: false,
    });

    const setActiveResource = useCallback((resourceId: string | null) => {
        setState((prev) => ({
            ...prev,
            activeResourceId: resourceId,
            lastSegment: null,
        }));
    }, []);

    const deliverNextSegment = useCallback(async (): Promise<SegmentResult | null> => {
        if (!state.activeResourceId) return null;

        setState((prev) => ({ ...prev, isDelivering: true }));

        try {
            const result = await getNextSegment(state.activeResourceId);
            setState((prev) => ({
                ...prev,
                lastSegment: result,
                isDelivering: false,
            }));
            return result;
        } catch {
            setState((prev) => ({ ...prev, isDelivering: false }));
            return null;
        }
    }, [state.activeResourceId]);

    const clearDelivery = useCallback(() => {
        setState({
            activeResourceId: null,
            lastSegment: null,
            isDelivering: false,
        });
    }, []);

    return (
        <ContentDeliveryContext.Provider
            value={{
                ...state,
                setActiveResource,
                deliverNextSegment,
                clearDelivery,
            }}
        >
            {children}
        </ContentDeliveryContext.Provider>
    );
};

export const useContentDelivery = () => {
    const context = useContext(ContentDeliveryContext);
    if (!context) {
        throw new Error("useContentDelivery must be used within ContentDeliveryProvider");
    }
    return context;
};
