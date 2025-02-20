/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 NightKoneko
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addChatBarButton, removeChatBarButton } from "@api/ChatButtons";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Button, ChannelStore, SelectedChannelStore, Tooltip, useEffect, useRef, useState } from "@webpack/common";

const TypingActions = findByPropsLazy("startTyping", "stopTyping");

const settings = definePluginSettings({
    activeChannels: {
        type: OptionType.CUSTOM,
        default: [] as string[],
        description: "List of channels where always typing is active",
    }
});

function AlwaysTypingButton() {
    const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout>();

    // Track channel changes
    useEffect(() => {
        const updateChannel = () => {
            setCurrentChannelId(SelectedChannelStore.getChannelId());
        };
        updateChannel();
        return SelectedChannelStore.addChangeListener(updateChannel);
    }, []);

    // Typing interval handler
    useEffect(() => {
        const intervalCallback = () => {
            settings.store.activeChannels.forEach(channelId => {
                TypingActions.startTyping(channelId);
            });
        };

        intervalRef.current = setInterval(intervalCallback, 5000);
        intervalCallback();

        return () => {
            clearInterval(intervalRef.current);
        };
    }, [settings.store.activeChannels]);

    const toggleActive = () => {
        if (!currentChannelId) return;

        settings.store.activeChannels = settings.store.activeChannels.includes(currentChannelId)
            ? settings.store.activeChannels.filter(id => id !== currentChannelId)
            : [...settings.store.activeChannels, currentChannelId];
    };

    const isCurrentActive = currentChannelId
        ? settings.store.activeChannels.includes(currentChannelId)
        : false;

    return (
        <Tooltip text={`Always Typing: ${isCurrentActive ? "ON" : "OFF"}`}>
            {(tooltipProps: any) => (
                <Button
                    {...tooltipProps}
                    onClick={toggleActive}
                    color={isCurrentActive ? "green" : "primary"}
                    look={isCurrentActive ? "filled" : "outlined"}
                    style={{
                        marginLeft: "2px",
                        minWidth: "unset",
                        padding: "2px",
                        position: "relative"
                    }}
                >
                    <div style={{
                        position: "relative",
                        width: "24px",
                        height: "24px"
                    }}>
                        <svg
                            aria-hidden="true"
                            role="img"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="currentColor"
                                d="M 5 19 C 3.9 19 3 19.9 3 21 C 3 22.1 3.9 23 5 23 C 6.1 23 7 22.1 7 21 C 7 19.9 6.1 19 5 19 Z M 12 19 C 10.9 19 10 19.9 10 21 C 10 22.1 10.9 23 12 23 C 13.1 23 14 22.1 14 21 C 14 19.9 13.1 19 12 19 Z M 19 19 C 17.9 19 17 19.9 17 21 C 17 22.1 17.9 23 19 23 C 20.1 23 21 22.1 21 21 C 21 19.9 20.1 19 19 19 Z"
                            />
                        </svg>
                        <div
                            style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: isCurrentActive ? "#23A55A" : "#80848E",
                                transition: "background-color 0.2s ease-in-out",
                                pointerEvents: "none",
                            }}
                        />
                    </div>
                </Button>
            )}
        </Tooltip>
    );
}

export default definePlugin({
    name: "AlwaysTyping",
    description: "Makes it appear like you're always typing",
    authors: [{ name: "NightKoneko", id: 252139949543915530n }],
    dependencies: ["ChatButtons"],
    required: true,
    settings,

    start() {
        if (!TypingActions) return;

        // Cleanup any orphaned channels
        settings.store.activeChannels = settings.store.activeChannels.filter(id =>
            ChannelStore.hasChannel(id) // Fixed to use ChannelStore instead of SelectedChannelStore
        );

        addChatBarButton("always-typing", AlwaysTypingButton);
    },

    stop() {
        removeChatBarButton("always-typing");
        settings.store.activeChannels.forEach(id => TypingActions.stopTyping(id));
        settings.store.activeChannels = [];
    }
});
