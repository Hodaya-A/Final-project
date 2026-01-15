module.exports = {
  presets: [["@babel/preset-env", { targets: { node: "current" } }]],
  plugins: [
    function () {
      return {
        visitor: {
          MetaProperty(path) {
            // הופך את import.meta.url לטקסט ש-Jest יכול לקרוא
            if (
              path.node.meta.name === "import" &&
              path.node.property.name === "url"
            ) {
              path.replaceWith({
                type: "StringLiteral",
                value: `file://${process.cwd()}`,
              });
            }
          },
        },
      };
    },
  ],
};
