# C# Debug Visualizer

**C# Debug Visualizer** is a lightweight, free, and easy-to-use Visual Studio Code extension for visualizing C# variables during debugging. It supports a wide range of types including primitives, arrays, collections, DataTable, Dictionary, Tuple, and custom objects. It enhances your debugging workflow by offering clean, interactive visualization features right inside VS Code.

## Installation

1. Open Extensions in VS Code.
2. Search for "C# Debug Visualizer".
3. Install the extension, no additional setup required.

You're now ready to visualize C# variables instantly during debugging.

## Features

### Visualize Variables Instantly

Supports visualization of most .NET data types, including:

- **Primitive types** — int, string, bool, char, double, float, decimal, byte, sbyte, short, long, object, StringBuilder
- **Arrays** — All primitive-type arrays (int[], string[], bool[], etc.)
- **Generic Collections** — List\<T\>, HashSet\<T\>, Queue\<T\>, Stack\<T\>, LinkedList\<T\>, SortedSet\<T\>, ArrayList
- **Key-Value Collections** — Dictionary\<K,V\>, SortedDictionary\<K,V\>, SortedList\<K,V\>, Hashtable
- **DataTable types** — DataTable (with pagination), DataRow, DataColumn, DataSet
- **Tuples** — Tuple, ValueTuple
- **Custom Objects** — Any class with public properties
- **Null values** — Proper null handling for all types

How to use:
- Place your cursor on the variable
- Right-click and then Visualize _or_
press `Shift + Alt + V`

![Run extension with 'Visualize'](media/visualize.gif)

### Word Wrap for Long Outputs

Long output? Enable Word Wrap with one click to improve readability.

![Use word wrap feature](media/word-wrap.gif)

### One-Click Copy to Clipboard

Copy full visualized output to clipboard effortlessly.

![Use copy to clipboard feature](media/copy.gif)

### DataTable Viewer with Pagination

View large DataTables comfortably with built-in pagination and streaming row loading.

![Visualizing DataTable](media/datatable.gif)

### Export DataTable to CSV

Save DataTable results directly as a CSV file with Save As CSV.

![Use save as csv feature](media/export.gif)

### Native VS Code Search Support

Use `Ctrl + F` inside the viewer to search through the output.

![Use searching feature](media/search.png)

## Requirements

No external dependencies required.
Simply ensure:
- You are using Visual Studio Code v1.106.0 or later
- Your C# application is running in Debug mode
- Node.js >= 20.0.0 (for development only)

## Extension Settings

You can customize the UI to match your preferences through VS Code settings. Settings are applied reactively — changes take effect immediately without restarting.

Example:

![Change primary color](media/settings.png)

Available settings:

| Setting | Description | Default |
| ------- | ----------- | ------- |
| `csharpDebugVisualizer.colorTheme` | Choose color theme according to your preference. Options: Oceanic Breeze, Carbon Mist, Dreamscapes, Rosy Blush, Spring Serenity, Sunburst Glow | Oceanic Breeze |
| `csharpDebugVisualizer.recordsPerPage` | Choose records per page for DataTable variable type. Higher values take more time to load. Options: 5, 10, 20, 25, 50, All | 10 |

## Architecture

The extension follows a **Strategy Pattern** with provider-based architecture:

- **Provider Layer** — Each C# type category has a dedicated result provider (SingleType, Array, GenericList, Dictionary, DataTable, DataSet, Object)
- **Debug Adapter Layer** — Abstracts VS Code's Debug Adapter Protocol (DAP) for type-safe communication
- **Per-Request Context** — Each visualization runs with its own isolated request context, supporting safe concurrent usage
- **Webview Layer** — Vanilla HTML/CSS/JS frontend with state persistence and streaming data loading

### Key Design Decisions

- **Zero runtime dependencies** — Minimal attack surface, fast startup
- **Discriminated union results** — `ProviderResult<T>` ensures type-safe success/cancelled handling
- **Custom error hierarchy** — Error codes (CE001-CE006) for clear diagnostics
- **Singleton debug adapter** — Prevents event listener memory leaks across visualizations
- **Reactive configuration** — Settings update automatically via `onDidChangeConfiguration`

## Known Issues

If you encounter issues or unsupported types, feel free to reach out. Your feedback helps us improve.

## Release Notes

Refer to the [CHANGELOG](CHANGELOG.md) for detailed version history.

## Contributors
- [Krishna Tamakuwala](https://github.com/krishnatamakuwala)
- [Piyush Katariya](https://github.com/PiyushKatariya)
