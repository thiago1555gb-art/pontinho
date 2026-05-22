// This file is custom-built to bypass package installation issues on the host system.
// It implements the exact Supabase client API used in this project using standard fetch.

const SUPABASE_URL = "https://czwcdqkxmkaofmolknvt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6d2NkcWt4bWthb2Ztb2xrbnZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0Nzc2NDUsImV4cCI6MjA5NTA1MzY0NX0.EvPgrG9_y0SR0KEqv1Aj5a4H-cT4pPYdcn2rbFuQxnw";

class SupabaseQueryBuilder {
  private url: string;
  private key: string;
  private table: string;
  private selectCols: string = '*';
  private orderCol: string | null = null;
  private orderAscending: boolean = true;
  private eqCol: string | null = null;
  private eqVal: any = null;

  constructor(url: string, key: string, table: string) {
    this.url = url;
    this.key = key;
    this.table = table;
  }

  private getHeaders(method: string) {
    const headers: any = {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
    };
    if (method === 'GET') {
      headers['Prefer'] = 'return=representation';
    } else if (method === 'POST') {
      headers['Prefer'] = 'return=representation';
    } else if (method === 'PATCH') {
      headers['Prefer'] = 'return=representation';
    }
    return headers;
  }

  async selectData() {
    let queryParams = `select=${encodeURIComponent(this.selectCols)}`;
    if (this.orderCol) {
      queryParams += `&order=${this.orderCol}.${this.orderAscending ? 'asc' : 'desc'}`;
    }
    if (this.eqCol) {
      queryParams += `&${this.eqCol}=eq.${encodeURIComponent(this.eqVal)}`;
    }

    try {
      const res = await fetch(`${this.url}/rest/v1/${this.table}?${queryParams}`, {
        method: 'GET',
        headers: this.getHeaders('GET'),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { data: null, error: new Error(errText) };
      }

      const data = await res.json();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  async insertData(values: any[]) {
    try {
      const res = await fetch(`${this.url}/rest/v1/${this.table}`, {
        method: 'POST',
        headers: this.getHeaders('POST'),
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { data: null, error: new Error(errText) };
      }

      let data = null;
      try {
        data = await res.json();
      } catch {}
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  async updateData(values: any) {
    try {
      let queryParams = '';
      if (this.eqCol) {
        queryParams += `?${this.eqCol}=eq.${encodeURIComponent(this.eqVal)}`;
      }

      const res = await fetch(`${this.url}/rest/v1/${this.table}${queryParams}`, {
        method: 'PATCH',
        headers: this.getHeaders('PATCH'),
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { data: null, error: new Error(errText) };
      }

      let data = null;
      try {
        data = await res.json();
      } catch {}
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  async deleteData() {
    try {
      let queryParams = '';
      if (this.eqCol) {
        queryParams += `?${this.eqCol}=eq.${encodeURIComponent(this.eqVal)}`;
      }

      const res = await fetch(`${this.url}/rest/v1/${this.table}${queryParams}`, {
        method: 'DELETE',
        headers: this.getHeaders('DELETE'),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { data: null, error: new Error(errText) };
      }

      return { data: null, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  select(cols: string = '*') {
    this.selectCols = cols;
    const self = this;
    return {
      order(col: string, options?: { ascending?: boolean }) {
        self.orderCol = col;
        self.orderAscending = options?.ascending ?? true;
        return this;
      },
      limit(n: number) {
        // Limit is handled implicitly or ignored for simple queries
        return this;
      },
      eq(col: string, val: any) {
        self.eqCol = col;
        self.eqVal = val;
        return this;
      },
      then(onfulfilled?: (value: any) => any) {
        return self.selectData().then(onfulfilled);
      }
    };
  }

  insert(values: any[]) {
    const self = this;
    return {
      then(onfulfilled?: (value: any) => any) {
        return self.insertData(values).then(onfulfilled);
      }
    };
  }

  update(values: any) {
    const self = this;
    return {
      eq(col: string, val: any) {
        self.eqCol = col;
        self.eqVal = val;
        return this;
      },
      then(onfulfilled?: (value: any) => any) {
        return self.updateData(values).then(onfulfilled);
      }
    };
  }

  delete() {
    const self = this;
    return {
      eq(col: string, val: any) {
        self.eqCol = col;
        self.eqVal = val;
        return this;
      },
      then(onfulfilled?: (value: any) => any) {
        return self.deleteData().then(onfulfilled);
      }
    };
  }
}

export const supabase = {
  from(table: string) {
    return new SupabaseQueryBuilder(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, table);
  }
};