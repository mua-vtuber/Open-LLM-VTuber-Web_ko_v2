/**
 * 공유 경로 별칭 설정
 *
 * Vite와 Electron-Vite 모두에서 사용되는 경로 별칭을 정의합니다.
 * TypeScript의 paths 설정(tsconfig.web.json)과 동기화되어야 합니다.
 */

import { resolve } from 'path';
import type { Alias } from 'vite';

const rootDir = resolve(__dirname, '..');

/**
 * Vite alias 설정
 * - 배열 형식을 사용하여 하위 경로(/app, /framework 등)도 올바르게 해석
 * - find: 매칭할 import 경로 패턴
 * - replacement: 실제 파일 시스템 경로
 */
export const aliases: Alias[] = [
  {
    find: /^@\/(.*)$/,
    replacement: resolve(rootDir, 'src/$1'),
  },
  {
    find: /^@cubism\/(.*)$/,
    replacement: resolve(rootDir, 'src/lib/cubism/$1'),
  },
  {
    find: /^@framework\/(.*)$/,
    replacement: resolve(rootDir, 'src/lib/cubism/framework/$1'),
  },
];

/**
 * 객체 형식의 alias (일부 도구와의 호환성을 위해)
 */
export const aliasesObject: Record<string, string> = {
  '@': resolve(rootDir, 'src'),
  '@cubism': resolve(rootDir, 'src/lib/cubism'),
  '@framework': resolve(rootDir, 'src/lib/cubism/framework'),
};
