import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import { Ribbon } from './components/ribbon/Ribbon';
import { SchematicCanvas } from './components/canvas/Canvas';
import { StatusBar } from './components/StatusBar';
import { ComponentPalette } from './components/palette/ComponentPalette';
import { PropertiesPanel } from './components/properties/PropertiesPanel';
import { ExamplesDialog } from './components/dialogs/ExamplesDialog';
import { HelpDialog } from './components/dialogs/HelpDialog';
import { useUIStore } from './store/uiStore';
import { useSimulation } from './hooks/useSimulation';
import './App.css';

function App() {
  const { theme } = useUIStore();
  useSimulation(); // Runs the real-time electrical simulation engine loop

  return (
    <FluentProvider theme={theme === 'dark' ? webDarkTheme : webLightTheme}>
      <div className={`app-shell ${theme}`}>
        <Ribbon />
        <div className="workspace">
          <ComponentPalette />
          <SchematicCanvas />
          <PropertiesPanel />
        </div>
        <StatusBar />
        <ExamplesDialog />
        <HelpDialog />
      </div>
    </FluentProvider>
  );
}

export default App;
