/**
 * Class of single variable types
 */
class SingleVariableType {
    public static readonly char = "System.Char";

    public static readonly string = "System.String";

    public static readonly short = "System.Int16";
    public static readonly ushort = "System.UInt16";

    public static readonly int = "System.Int32";
    public static readonly uint = "System.UInt32";  

    public static readonly long = "System.Int64";
    public static readonly ulong = "System.UInt64";

    public static readonly double = "System.Double";

    public static readonly float = "System.Single";

    public static readonly bool = "System.Boolean";

    public static readonly decimal = "System.Decimal";

    public static readonly byte = "System.Byte";
    public static readonly sbyte = "System.SByte";

    public static readonly obj = "System.Object";

    public static readonly stringBuilder = "System.Text.StringBuilder";

    public static get typeArray(): string[] {
        return [SingleVariableType.char, SingleVariableType.string, SingleVariableType.short, SingleVariableType.ushort, SingleVariableType.int, SingleVariableType.uint, SingleVariableType.long, SingleVariableType.ulong, SingleVariableType.double, SingleVariableType.float, SingleVariableType.bool, SingleVariableType.decimal, SingleVariableType.byte, SingleVariableType.sbyte, SingleVariableType.obj, SingleVariableType.stringBuilder];
    }
}

/**
 * Class of array variable types
 */
class ArrayVariableType {
    public static readonly charArray = "System.Char[]";

    public static readonly stringArray = "System.String[]";

    public static readonly shortArray = "System.Int16[]";
    public static readonly ushortArray = "System.UInt16[]";

    public static readonly intArray = "System.Int32[]";
    public static readonly uintArray = "System.UInt32[]";  

    public static readonly longArray = "System.Int64[]";
    public static readonly ulongArray = "System.UInt64[]";

    public static readonly doubleArray = "System.Double[]";

    public static readonly floatArray = "System.Single[]";

    public static readonly boolArray = "System.Boolean[]";

    public static readonly decimalArray = "System.Decimal[]";

    public static readonly byteArray = "System.Byte[]";
    public static readonly sbyteArray = "System.SByte[]";

    public static readonly objArray = "System.Object[]";

    public static readonly stringBuilderArray = "System.Text.StringBuilder[]";

    public static get typeArray(): string[] {
        return [ArrayVariableType.charArray, ArrayVariableType.stringArray, ArrayVariableType.shortArray, ArrayVariableType.ushortArray, ArrayVariableType.intArray, ArrayVariableType.uintArray, ArrayVariableType.longArray, ArrayVariableType.ulongArray, ArrayVariableType.doubleArray, ArrayVariableType.floatArray, ArrayVariableType.boolArray, ArrayVariableType.decimalArray, ArrayVariableType.byteArray, ArrayVariableType.sbyteArray, ArrayVariableType.objArray, ArrayVariableType.stringBuilderArray];
    }
}

/**
 * Class of datatable related variable types
 */
class DataTable {
    public static readonly dataColumn = "System.Data.DataColumn";
    public static readonly dataRow = "System.Data.DataRow";
    public static readonly dataTable = "System.Data.DataTable";
}
 
export {
    SingleVariableType,
    ArrayVariableType,
    DataTable
};