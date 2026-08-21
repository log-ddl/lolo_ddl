# Video Studio feature

This directory is the ownership boundary for the existing AI video workflow.

- `entry.tsx` initializes and mounts the feature.
- `components/` contains the complete feature shell: navigation, project dashboard, header, preview, properties, and timeline.
- Panels, stores, workers, video types, and video libraries live under this feature boundary.
- Theme, language, license, help, and reusable UI primitives remain application-wide dependencies.
- API providers, Max Studio settings, CLI, image hosting, and AI model configuration are currently owned by Video Studio and live here.
- `video-studio-settings-store.ts` keeps the legacy persistence key for backward-compatible settings migration; UI language is stored separately under `src/shared/stores`.

Do not add new top-level application features to Video Studio's `Tab` type. Register them in `src/features/feature-registry.ts` instead.
