"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/api/items";
exports.ids = ["pages/api/items"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "(api)/./lib/prisma.js":
/*!***********************!*\
  !*** ./lib/prisma.js ***!
  \***********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\nconst { PrismaClient } = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\nconst globalForPrisma = global;\nif (!globalForPrisma.prisma) {\n    globalForPrisma.prisma = new PrismaClient();\n}\nmodule.exports = globalForPrisma.prisma;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwaSkvLi9saWIvcHJpc21hLmpzIiwibWFwcGluZ3MiOiI7QUFBQSxNQUFNLEVBQUVBLFlBQVksRUFBRSxHQUFHQyxtQkFBT0EsQ0FBQztBQUVqQyxNQUFNQyxrQkFBa0JDO0FBRXhCLElBQUksQ0FBQ0QsZ0JBQWdCRSxNQUFNLEVBQUU7SUFDM0JGLGdCQUFnQkUsTUFBTSxHQUFHLElBQUlKO0FBQy9CO0FBRUFLLE9BQU9DLE9BQU8sR0FBR0osZ0JBQWdCRSxNQUFNIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vdW5pZnktbmV4dC8uL2xpYi9wcmlzbWEuanM/NzUxNSJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7IFByaXNtYUNsaWVudCB9ID0gcmVxdWlyZSgnQHByaXNtYS9jbGllbnQnKTtcclxuXHJcbmNvbnN0IGdsb2JhbEZvclByaXNtYSA9IGdsb2JhbDtcclxuXHJcbmlmICghZ2xvYmFsRm9yUHJpc21hLnByaXNtYSkge1xyXG4gIGdsb2JhbEZvclByaXNtYS5wcmlzbWEgPSBuZXcgUHJpc21hQ2xpZW50KCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZ2xvYmFsRm9yUHJpc21hLnByaXNtYTtcclxuIl0sIm5hbWVzIjpbIlByaXNtYUNsaWVudCIsInJlcXVpcmUiLCJnbG9iYWxGb3JQcmlzbWEiLCJnbG9iYWwiLCJwcmlzbWEiLCJtb2R1bGUiLCJleHBvcnRzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(api)/./lib/prisma.js\n");

/***/ }),

/***/ "(api)/./pages/api/items/index.js":
/*!**********************************!*\
  !*** ./pages/api/items/index.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ handler)\n/* harmony export */ });\nconst prisma = __webpack_require__(/*! ../../../lib/prisma */ \"(api)/./lib/prisma.js\");\nasync function handler(req, res) {\n    if (req.method === \"GET\") {\n        const items = await prisma.item.findMany({\n            orderBy: {\n                createdAt: \"desc\"\n            }\n        });\n        return res.json(items);\n    }\n    if (req.method === \"POST\") {\n        try {\n            const { title, content, image } = req.body;\n            if (!title) return res.status(400).json({\n                error: \"title is required\"\n            });\n            const item = await prisma.item.create({\n                data: {\n                    title,\n                    content: content || null,\n                    image: image || null\n                }\n            });\n            return res.status(201).json(item);\n        } catch (err) {\n            console.error(\"items POST error\", err);\n            return res.status(500).json({\n                error: \"Internal server error\"\n            });\n        }\n    }\n    res.setHeader(\"Allow\", [\n        \"GET\",\n        \"POST\"\n    ]);\n    res.status(405).end(`Method ${req.method} Not Allowed`);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwaSkvLi9wYWdlcy9hcGkvaXRlbXMvaW5kZXguanMiLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE1BQU1BLFNBQVNDLG1CQUFPQSxDQUFDO0FBRVIsZUFBZUMsUUFBUUMsR0FBRyxFQUFFQyxHQUFHO0lBQzVDLElBQUlELElBQUlFLE1BQU0sS0FBSyxPQUFPO1FBQ3hCLE1BQU1DLFFBQVEsTUFBTU4sT0FBT08sSUFBSSxDQUFDQyxRQUFRLENBQUM7WUFBRUMsU0FBUztnQkFBRUMsV0FBVztZQUFPO1FBQUU7UUFDMUUsT0FBT04sSUFBSU8sSUFBSSxDQUFDTDtJQUNsQjtJQUVBLElBQUlILElBQUlFLE1BQU0sS0FBSyxRQUFRO1FBQ3pCLElBQUk7WUFDRixNQUFNLEVBQUVPLEtBQUssRUFBRUMsT0FBTyxFQUFFQyxLQUFLLEVBQUUsR0FBR1gsSUFBSVksSUFBSTtZQUMxQyxJQUFJLENBQUNILE9BQU8sT0FBT1IsSUFBSVksTUFBTSxDQUFDLEtBQUtMLElBQUksQ0FBQztnQkFBRU0sT0FBTztZQUFvQjtZQUNyRSxNQUFNVixPQUFPLE1BQU1QLE9BQU9PLElBQUksQ0FBQ1csTUFBTSxDQUFDO2dCQUFFQyxNQUFNO29CQUFFUDtvQkFBT0MsU0FBU0EsV0FBVztvQkFBTUMsT0FBT0EsU0FBUztnQkFBSztZQUFFO1lBQ3hHLE9BQU9WLElBQUlZLE1BQU0sQ0FBQyxLQUFLTCxJQUFJLENBQUNKO1FBQzlCLEVBQUUsT0FBTWEsS0FBSztZQUNYQyxRQUFRSixLQUFLLENBQUMsb0JBQW9CRztZQUNsQyxPQUFPaEIsSUFBSVksTUFBTSxDQUFDLEtBQUtMLElBQUksQ0FBQztnQkFBRU0sT0FBTztZQUF3QjtRQUMvRDtJQUNGO0lBRUFiLElBQUlrQixTQUFTLENBQUMsU0FBUztRQUFDO1FBQU87S0FBTztJQUN0Q2xCLElBQUlZLE1BQU0sQ0FBQyxLQUFLTyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUVwQixJQUFJRSxNQUFNLENBQUMsWUFBWSxDQUFDO0FBQ3hEIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vdW5pZnktbmV4dC8uL3BhZ2VzL2FwaS9pdGVtcy9pbmRleC5qcz8zZWE4Il0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHByaXNtYSA9IHJlcXVpcmUoJy4uLy4uLy4uL2xpYi9wcmlzbWEnKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcclxuICBpZiAocmVxLm1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgcHJpc21hLml0ZW0uZmluZE1hbnkoeyBvcmRlckJ5OiB7IGNyZWF0ZWRBdDogJ2Rlc2MnIH0gfSk7XHJcbiAgICByZXR1cm4gcmVzLmpzb24oaXRlbXMpO1xyXG4gIH1cclxuXHJcbiAgaWYgKHJlcS5tZXRob2QgPT09ICdQT1NUJykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgeyB0aXRsZSwgY29udGVudCwgaW1hZ2UgfSA9IHJlcS5ib2R5O1xyXG4gICAgICBpZiAoIXRpdGxlKSByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ3RpdGxlIGlzIHJlcXVpcmVkJyB9KTtcclxuICAgICAgY29uc3QgaXRlbSA9IGF3YWl0IHByaXNtYS5pdGVtLmNyZWF0ZSh7IGRhdGE6IHsgdGl0bGUsIGNvbnRlbnQ6IGNvbnRlbnQgfHwgbnVsbCwgaW1hZ2U6IGltYWdlIHx8IG51bGwgfSB9KTtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAxKS5qc29uKGl0ZW0pO1xyXG4gICAgfSBjYXRjaChlcnIpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignaXRlbXMgUE9TVCBlcnJvcicsIGVycik7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJlcy5zZXRIZWFkZXIoJ0FsbG93JywgWydHRVQnLCAnUE9TVCddKTtcclxuICByZXMuc3RhdHVzKDQwNSkuZW5kKGBNZXRob2QgJHtyZXEubWV0aG9kfSBOb3QgQWxsb3dlZGApO1xyXG59XHJcbiJdLCJuYW1lcyI6WyJwcmlzbWEiLCJyZXF1aXJlIiwiaGFuZGxlciIsInJlcSIsInJlcyIsIm1ldGhvZCIsIml0ZW1zIiwiaXRlbSIsImZpbmRNYW55Iiwib3JkZXJCeSIsImNyZWF0ZWRBdCIsImpzb24iLCJ0aXRsZSIsImNvbnRlbnQiLCJpbWFnZSIsImJvZHkiLCJzdGF0dXMiLCJlcnJvciIsImNyZWF0ZSIsImRhdGEiLCJlcnIiLCJjb25zb2xlIiwic2V0SGVhZGVyIiwiZW5kIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(api)/./pages/api/items/index.js\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(api)/./pages/api/items/index.js"));
module.exports = __webpack_exports__;

})();