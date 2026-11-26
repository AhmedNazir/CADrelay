import React from "react";
import {
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  Tab,
  TabList,
  Tooltip,
  Badge,
} from "@fluentui/react-components";
import {
  New24Regular,
  Open24Regular,
  Save24Regular,
  ArrowUndo24Regular,
  ArrowRedo24Regular,
  BookOpen24Regular,
  Warning24Regular,
  Play24Regular,
  Pause24Regular,
  Stop24Regular,
  Next24Regular,
} from "@fluentui/react-icons";
import { useUIStore } from "../../store/uiStore";
import { useSimStore } from "../../store/simStore";
import { useCanvasStore } from "../../store/canvasStore";
import { saveProjectJSON, loadProjectJSON } from "../../utils/fileIO";
import { HomeTab } from "./tabs/HomeTab";
import { InsertTab } from "./tabs/InsertTab";
import { ViewTab } from "./tabs/ViewTab";
import styles from "./Ribbon.module.css";

export const Ribbon: React.FC = () => {
  const {
    activeRibbonTab,
    setActiveRibbonTab,
    theme,
    setExamplesModalOpen,
    setHelpModalOpen,
  } = useUIStore();

  const { components, wires, undo, redo, clearAll } = useCanvasStore();
  const { simState, isShortCircuit, play, pause, stop, step } = useSimStore();

  const handleNew = () => {
    if (
      components.length === 0 ||
      window.confirm("Start a new project? Unsaved changes will be lost.")
    ) {
      clearAll();
    }
  };

  const handleSave = () => {
    saveProjectJSON("CADrelay_Circuit", components, wires);
  };

  const handleOpen = async () => {
    try {
      const data = await loadProjectJSON();
      useCanvasStore.getState().loadCircuit(data.components, data.wires);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      className={`${styles.ribbonContainer} ${theme === "dark" ? styles.dark : ""}`}
    >
      {/* Title Bar */}
      <div className={styles.titleBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className={styles.appTitle}>⚡ CADrelay</span>
          <span className={styles.projectName}>
            — Industrial Circuit CAD & Simulator
          </span>
        </div>

        {/* Simulation Controls in Title Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginLeft: "auto",
          }}
        >
          <Tooltip content="Start Simulation (F5)" relationship="label">
            <ToolbarButton
              icon={<Play24Regular />}
              appearance={simState === "running" ? "primary" : "subtle"}
              onClick={play}
              disabled={simState === "running"}
            >
              Play
            </ToolbarButton>
          </Tooltip>
          <Tooltip content="Pause / Resume" relationship="label">
            <ToolbarButton
              icon={<Pause24Regular />}
              appearance={simState === "paused" ? "primary" : "subtle"}
              onClick={pause}
              disabled={simState === "stopped"}
            >
              {simState === "paused" ? "Resume" : "Pause"}
            </ToolbarButton>
          </Tooltip>
          <Tooltip content="Stop Simulation" relationship="label">
            <ToolbarButton
              icon={<Stop24Regular />}
              onClick={stop}
              disabled={simState === "stopped"}
            >
              Stop
            </ToolbarButton>
          </Tooltip>
          <Tooltip content="Single Step" relationship="label">
            <ToolbarButton
              icon={<Next24Regular />}
              onClick={step}
              disabled={simState === "running"}
            >
              Step
            </ToolbarButton>
          </Tooltip>

          <div
            style={{
              width: 1,
              height: 24,
              background: "var(--colorNeutralStroke1)",
              margin: "0 8",
            }}
          />

          {isShortCircuit && (
            <Badge
              appearance="filled"
              color="danger"
              icon={<Warning24Regular />}
            >
              SHORT CIRCUIT
            </Badge>
          )}

          {simState === "running" && (
            <Badge
              appearance="filled"
              color="success"
              className={styles.simBadge}
            >
              ● SIMULATING LIVE
            </Badge>
          )}

          <Tooltip
            content="Keyboard Shortcuts & User Guide"
            relationship="label"
          >
            <button
              className={styles.titleHelpBtn}
              onClick={() => setHelpModalOpen(true)}
            >
              Help & Shortcuts
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Quick Access Toolbar */}
      <div className={styles.quickAccess}>
        <Toolbar size="small">
          <Tooltip content="New Project" relationship="label">
            <ToolbarButton icon={<New24Regular />} onClick={handleNew} />
          </Tooltip>
          <Tooltip content="Open .cdr Project File" relationship="label">
            <ToolbarButton icon={<Open24Regular />} onClick={handleOpen} />
          </Tooltip>
          <Tooltip content="Save Project (.cdr)" relationship="label">
            <ToolbarButton icon={<Save24Regular />} onClick={handleSave} />
          </Tooltip>
          <ToolbarDivider />
          <Tooltip content="Undo (Ctrl+Z)" relationship="label">
            <ToolbarButton icon={<ArrowUndo24Regular />} onClick={undo} />
          </Tooltip>
          <Tooltip content="Redo (Ctrl+Y)" relationship="label">
            <ToolbarButton icon={<ArrowRedo24Regular />} onClick={redo} />
          </Tooltip>
          <ToolbarDivider />
          <Tooltip
            content="Browse Pre-built Example Circuits"
            relationship="label"
          >
            <ToolbarButton
              icon={<BookOpen24Regular />}
              onClick={() => setExamplesModalOpen(true)}
            >
              Templates
            </ToolbarButton>
          </Tooltip>
        </Toolbar>
      </div>

      {/* Ribbon Tabs */}
      <TabList
        selectedValue={activeRibbonTab}
        onTabSelect={(_, data) => setActiveRibbonTab(data.value as string)}
        className={styles.tabList}
      >
        <Tab value="home">Home</Tab>
        <Tab value="insert">Insert</Tab>
        <Tab value="view">View</Tab>
      </TabList>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeRibbonTab === "home" && <HomeTab />}
        {activeRibbonTab === "insert" && <InsertTab />}
        {activeRibbonTab === "view" && <ViewTab />}
      </div>
    </div>
  );
};
