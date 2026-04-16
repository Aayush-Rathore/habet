const rows = [
  { label: "App Name", value: "HABET APK" },
  { label: "App Size", value: "66.54 MB" },
  { label: "App Bonus", value: "Rs. 500 New User Bonus" },
  { label: "App Developer", value: "HABET.COM" },
];

export default function AppInfoTable() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-blue-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.label}
              className={index % 2 === 0 ? "bg-blue-50" : "bg-white"}
            >
              <td className="px-5 py-3 font-semibold text-blue-800 w-2/5">
                {row.label}
              </td>
              <td className="px-5 py-3 text-gray-700">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
