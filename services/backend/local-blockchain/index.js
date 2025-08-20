"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LazChainArtifact = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
exports.LazChainArtifact = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(process.cwd(), 'services/backend/artifacts/contracts/LazChain.sol/LazChain.json'), 'utf-8'));
