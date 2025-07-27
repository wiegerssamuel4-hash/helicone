import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markup-templating";
import "prismjs/themes/prism.css";
import Editor from "react-simple-code-editor";
import { useTheme } from "next-themes";
import { useMemo, useState, Suspense } from "react";
import { TEMPLATE_REGEX } from "@helicone-package/prompts/templates";
import { useVariableColorMapStore } from "@/store/features/playground/variableColorMap";
import { HeliconeTemplateManager } from "@helicone-package/prompts/templates";
import dynamic from "next/dynamic";

// Lazy load Monaco Editor to reduce initial bundle size
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => ({ default: mod.Editor })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-800 rounded border">
        <div className="text-sm text-gray-500">Loading editor...</div>
      </div>
    ),
  }
);

// Lazy load editor types to avoid importing heavy Monaco types upfront
const monacoEditorType = dynamic(
  () => import("monaco-editor").then((mod) => mod.editor),
  { ssr: false }
);

const MAX_EDITOR_HEIGHT = 1000000;
const MonacoMarkdownEditor = (props: MarkdownEditorProps) => {
  const {
    text,
    setText,
    language,
    disabled = false,
    className,
    textareaClassName,
    containerClassName,
    monacoOptions,
    showLargeTextWarning = true,
  } = props;
  const { theme: currentTheme } = useTheme();
  const minHeight = 100;

  const [height, setHeight] = useState(minHeight);
  const updateHeight = (editor: any) =>
    setHeight(
      Math.min(
        MAX_EDITOR_HEIGHT,
        Math.max(minHeight, editor.getContentHeight()),
      ),
    );

  return (
    <div className={containerClassName}>
      <Suspense fallback={
        <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-800 rounded border">
          <div className="text-sm text-gray-500">Loading editor...</div>
        </div>
      }>
        <MonacoEditor
          value={typeof text === "string" ? text : JSON.stringify(text)}
          onChange={(value) => setText(value || "")}
          language={language}
          theme={currentTheme === "dark" ? "vs-dark" : "vs-light"}
          onMount={(editor) =>
            editor.onDidContentSizeChange(() => updateHeight(editor))
          }
          height={height}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            fontSize: 12,
            lineNumbers: "off",
            folding: false,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 0,
            glyphMargin: false,
            readOnly: disabled,
            ...monacoOptions,
          }}
        />
      </Suspense>
      {showLargeTextWarning && (
        <i className="text-xs text-gray-500">
          Helicone: Large text detected, falling back to large text editor
        </i>
      )}
    </div>
  );
};

interface MarkdownEditorProps {
  text: string | object;
  setText: (text: string) => void;
  language: "json" | "markdown" | "python" | "yaml";
  disabled?: boolean;
  className?: string;
  textareaClassName?: string;
  monaco?: boolean;
  id?: string;
  placeholder?: string;
  containerClassName?: string;
  monacoOptions?: monacoEditorType.IStandaloneEditorConstructionOptions;
  showLargeTextWarning?: boolean;
}

const LARGE_TEXT_THRESHOLD = 100;

const LARGE_TEXT_THRESHOLD_CHARS = 20_000;

const MarkdownEditor = (props: MarkdownEditorProps) => {
  const {
    text: noSafeText,
    setText,
    language,
    disabled = false,
    className,
    textareaClassName,
    monaco = false,
    monacoOptions,
    id,
    placeholder,
  } = props;

  const text = useMemo(() => {
    if (typeof noSafeText === "string") {
      return noSafeText;
    }
    return JSON.stringify(noSafeText, null, 2);
  }, [noSafeText]);

  const languageMap = {
    json: {
      lang: languages.json,
      ref: "json",
    },
    markdown: {
      lang: languages.markdown,
      ref: "markdown",
    },
    python: {
      lang: languages.python,
      ref: "python",
    },
    yaml: {
      lang: languages.yaml,
      ref: "yaml",
    },
  };

  const { lang, ref } = languageMap[language];
  const { getColor } = useVariableColorMapStore();

  if (
    text.split("\n").length > LARGE_TEXT_THRESHOLD ||
    monaco ||
    text.length > LARGE_TEXT_THRESHOLD_CHARS
  ) {
    return <MonacoMarkdownEditor {...props} showLargeTextWarning={!monaco} />;
  }

  return (
    <Editor
      placeholder={placeholder}
      {...(id && { id })}
      value={text}
      onValueChange={setText}
      highlight={(code) => {
        if (!code) return "";
        if (typeof code !== "string") return "";

        let highlighted = highlight(code, lang, ref);
        if (language === "markdown" || language === "json") {
          highlighted = highlighted.replace(TEMPLATE_REGEX, (match) => {
            const variable = HeliconeTemplateManager.extractVariables(match)[0];
            if (!variable) return match;
            const color = getColor(variable.name);
            return `<span class="font-bold text-${color}">${match}</span>`;
          });
        }

        return highlighted;
      }}
      padding={16}
      className={
        className ??
        `whitespace-pre-wrap rounded-lg border border-gray-300 text-sm text-black dark:border-gray-700 dark:text-white`
      }
      textareaClassName={textareaClassName ?? ""}
      // mono font
      style={{
        fontFamily: '"Fira Code", "Fira Mono", monospace',
        fontSize: 12,
      }}
      disabled={disabled}
    />
  );
};

export default MarkdownEditor;
