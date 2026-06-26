// Mock implementation of Cloudinary image uploads

export const mockCloudinaryResponse = {
  secure_url: 'https://res.cloudinary.com/dfvh4jcsh/image/upload/v123456789/mock-image.png',
  public_id: 'mock-image-id',
  format: 'png',
  width: 800,
  height: 600
};

export const setupCloudinaryMock = () => {
  const originalFetch = global.fetch;

  global.fetch = jest.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = typeof input === 'string' ? input : input.toString();

    if (urlStr.includes('api.cloudinary.com/v1_1/dfvh4jcsh/image/upload') && init?.method === 'POST') {
      const body = init.body;
      let preset = '';

      if (body instanceof FormData) {
        preset = body.get('upload_preset') as string;
      }

      if (preset !== '11players') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: { message: 'Invalid upload preset' } })
        } as any);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockCloudinaryResponse)
      } as any);
    }

    if (originalFetch) {
      return originalFetch(input, init);
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({})
    } as any);
  }) as any;
};
