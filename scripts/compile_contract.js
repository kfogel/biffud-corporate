var fs = require('fs');

function latex_cleanup(text) {
    text = text.replace(/\$?\{[^\}]*\}/g, "\\underline{\\hspace{5cm}}");
    text = text.replace(/\_{2,}/g, "\\underline{\\hspace{5cm}}");
    return text
}

// Make sure the user passed in a contract to compile
if(process.argv.length < 3) {
    console.log("HOW TO USE: compile_contract path/to/contract.json [tex|md]");
    process.exit();
}

// Set the path properly (this script should be called from project root)
var contract_file = __dirname + "/../" + process.argv[2];

// Load the contract JSON
try {
    var contract = require(contract_file);
} catch (e) {
    console.log(e)
    console.log("Couldn't load the contract file.")
}

var format = "tex";
if(process.argv.length > 3) {
    format = process.argv[3];
}

// Generate a .tex file
var output_file = "generated/contract." + format
var output_stream = fs.createWriteStream(output_file);
switch(format) {
    case "tex":
        output_stream.write("\\documentclass{article}\n");
        output_stream.write("\\title{" + contract.title + "}\n");
        output_stream.write("\\author{Bad Idea Factory Limited Liability Corporation}\n");
        output_stream.write("\\begin{document}\n");
        output_stream.write("\\maketitle\n");
        for(var x = 0; x < contract.content.length; x += 1) {
            var line = contract.content[x];
            if("text" in line) {
                line.text = latex_cleanup(line.text);
            }
            if("rows" in line) {
                for(var y = 0; y < line.rows.length; y +=1) {
                    line.rows[y] = line.rows[y].map(latex_cleanup)
                }
            }
            switch(line.type) {
                case "paragraph":
                    output_stream.write("\\paragraph{" + line.text + "}" + "\n");
                    break;
                case "section":
                    output_stream.write("\\section{" + line.text + "}" + "\n");
                    break;
                case "subsection":
                    output_stream.write("\\subsection{" + line.text + "}" + "\n");
                    break;
                case "exhibit":
                    output_stream.write("\\newpage" + "\n");
                    output_stream.write("\\section*{" + line.text + "}" + "\n");
                    break;
                case "table":
                    output_stream.write("\\paragraph{}")
                    if(line.rows.length > 0) {
                        output_stream.write("\\begin{tabular}{ " + line.rows[0].map(function(x) { return "l"; }).join(" ") + " }" + "\n");
                        for(var y = 0; y < line.rows.length; y +=1) {
                            output_stream.write(line.rows[y].join(" & ") + " \\\\\n");
                        }
                        output_stream.write("\\end{tabular}" + "\n");
                    }
                    break;
            }
        }
        output_stream.write("\\end{document}\n");
        break;
    case "md":
        output_stream.write("# " + contract.title + "\n");
        output_stream.write("\n");
        var section_count = 0;
        var subsection_count = 0;
        for(var x = 0; x < contract.content.length; x += 1) {
            var line = contract.content[x];
            switch(line.type) {
                case "paragraph":
                    output_stream.write(line.text + "\n");
                    break;
                case "section":
                    section_count += 1;
                    subsection_count = 0;
                    output_stream.write("\n");
                    output_stream.write("## " + section_count + " " + line.text + "\n");
                    output_stream.write("\n");
                    break;
                case "subsection":
                    subsection_count += 1;
                    output_stream.write("\n");
                    output_stream.write("### " + section_count + "." + subsection_count + " " + line.text + "\n");
                    output_stream.write("\n");
                    break;
                case "exhibit":
                    output_stream.write("\n");
                    output_stream.write("# " + line.text + "\n");
                    output_stream.write("\n");
                    section_count = 0;
                    subsection_count = 0;
                    break;
                case "table":
                    if(line.rows.length > 0) {
                        output_stream.write(line.rows[0].join("|") + "\n");
                        output_stream.write(line.rows[0].map(function(x) { return "---"; }).join("|") + "\n");
                    }

                    for(var y = 1; y < line.rows.length; y +=1) {
                        output_stream.write(line.rows[y].join("|") + "\n");
                    }
                    break;
            }
        }
    default:
        break;
}
