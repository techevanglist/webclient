import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {bitcoinUrl} from '../../shared/config';

@Injectable()
export class BitcoinService {
  constructor(private http: HttpClient) {
  }

  getBitcoinValue() {
    return this.http.get<any>(`${bitcoinUrl}api/v1.0/bitcoin/getBitcoinValue`);
  }

  getNewWalletAddress() {
    return this.http.get<any>(`${bitcoinUrl}api/v1.0/bitcoin/createNewWallet`);
  }

  confirmTransaction(data: any) {
    const body = {
      'fromWIF': data.fromWIF,
      'fromAddress': data.fromAddress,
      'toAddress': data.toAddress,
      'value': data.value,
      'opt_timeout': data.opt_value,
      'opt_interval': data.opt_interval
    };

    return this.http.post(`${bitcoinUrl}api/v1.0/bitcoin/createPushAndConfirmTransaction`, data);
  }
}