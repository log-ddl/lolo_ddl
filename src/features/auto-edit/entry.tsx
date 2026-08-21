import { Dashboard } from "./components/dashboard";
import { EditorShell } from "./components/editor-shell";
import { useEditorStore } from "./store/editor-store";
import { useAutoEditViewStore } from "./store/view-store";

/**
 * Auto Edit feature root: the project dashboard, or the editor once a project is open.
 *
 * The view and the open project live in separate stores, so the editor is only
 * mounted when a project actually exists — otherwise every panel would render its
 * "no project" fallback and the whole editor would look like blank rectangles.
 */
export default function AutoEditFeature() {
  const view = useAutoEditViewStore((s) => s.view);
  const hasProject = useEditorStore((s) => s.project != null);
  return view === "editor" && hasProject ? <EditorShell /> : <Dashboard />;
}
