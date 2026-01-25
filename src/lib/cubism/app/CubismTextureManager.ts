/**
 * CubismTextureManager - 텍스처 로드 및 관리
 *
 * Live2D 모델의 텍스처를 WebGL에 로드하고 관리합니다.
 */

export interface TextureInfo {
  id: WebGLTexture;
  width: number;
  height: number;
  fileName: string;
}

export class CubismTextureManager {
  private _textures: TextureInfo[] = [];
  private _gl: WebGLRenderingContext | null = null;

  /**
   * WebGL 컨텍스트 설정
   */
  public setGl(gl: WebGLRenderingContext): void {
    this._gl = gl;
  }

  /**
   * 이미지 URL에서 텍스처 생성
   * @param url 텍스처 이미지 URL
   * @param usePremultiply 프리멀티플라이 알파 사용 여부
   * @returns 생성된 텍스처 정보
   */
  public async createTextureFromUrl(
    url: string,
    usePremultiply: boolean = true
  ): Promise<TextureInfo> {
    return new Promise((resolve, reject) => {
      if (!this._gl) {
        reject(new Error('WebGL context not set'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const gl = this._gl!;

        // 텍스처 생성
        const texture = gl.createTexture();
        if (!texture) {
          reject(new Error('Failed to create texture'));
          return;
        }

        gl.bindTexture(gl.TEXTURE_2D, texture);

        // 텍스처 파라미터 설정
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // 프리멀티플라이 알파 설정
        if (usePremultiply) {
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
        }

        // 텍스처 이미지 업로드
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img
        );

        // 밉맵 생성
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.bindTexture(gl.TEXTURE_2D, null);

        const textureInfo: TextureInfo = {
          id: texture,
          width: img.width,
          height: img.height,
          fileName: url,
        };

        this._textures.push(textureInfo);
        resolve(textureInfo);
      };

      img.onerror = () => {
        reject(new Error(`Failed to load texture: ${url}`));
      };

      img.src = url;
    });
  }

  /**
   * 인덱스로 텍스처 정보 가져오기
   */
  public getTextureInfo(index: number): TextureInfo | null {
    if (index < 0 || index >= this._textures.length) {
      return null;
    }
    return this._textures[index];
  }

  /**
   * 파일명으로 텍스처 찾기
   */
  public getTextureByFileName(fileName: string): TextureInfo | null {
    return this._textures.find((t) => t.fileName === fileName) || null;
  }

  /**
   * 텍스처 개수 반환
   */
  public getTextureCount(): number {
    return this._textures.length;
  }

  /**
   * 모든 텍스처 해제
   */
  public releaseTextures(): void {
    if (!this._gl) return;

    for (const textureInfo of this._textures) {
      this._gl.deleteTexture(textureInfo.id);
    }
    this._textures = [];
  }

  /**
   * 특정 텍스처 해제
   */
  public releaseTextureByIndex(index: number): void {
    if (!this._gl) return;
    if (index < 0 || index >= this._textures.length) return;

    this._gl.deleteTexture(this._textures[index].id);
    this._textures.splice(index, 1);
  }

  /**
   * 리소스 정리
   */
  public dispose(): void {
    this.releaseTextures();
    this._gl = null;
  }
}
