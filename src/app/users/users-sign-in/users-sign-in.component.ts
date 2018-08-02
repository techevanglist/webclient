// Angular
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef, HostListener
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Bootstrap
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Store } from '@ngrx/store';
import { MatKeyboardComponent, MatKeyboardRef, MatKeyboardService } from '@ngx-material-keyboard/core';
import { Observable } from 'rxjs/Observable';

// Store
import { AppState } from '../../store/datatypes';
import { LogIn, RecoverPassword } from '../../store/actions';
import { FinalLoading } from '../../store/actions';

// Service
import { SharedService } from '../../store/services';
import { TakeUntilDestroy, OnDestroy } from 'ngx-take-until-destroy';
import { ESCAPE_KEYCODE } from '../../shared/config';
import { PasswordValidation } from '../users-create-account/users-create-account.component';

@TakeUntilDestroy()
@Component({
  selector: 'app-users-sign-in',
  templateUrl: './users-sign-in.component.html',
  styleUrls: ['./users-sign-in.component.scss']
})
export class UsersSignInComponent implements OnDestroy, OnInit {
  readonly destroyed$: Observable<boolean>;

  loginForm: FormGroup;
  recoverPasswordForm: FormGroup;
  resetPasswordForm: FormGroup;
  showFormErrors = false;
  showResetPasswordFormErrors = false;
  errorMessage: string = '';
  isLoading: boolean = false;
  // == NgBootstrap Modal stuffs
  resetModalRef: any;
  focusedInput: string = '';
  username: string = '';
  password: string = 'password';
  layout: any = 'alphanumeric';
  isKeyboardOpened: boolean;
  isRecoverFormSubmitted: boolean;
  @ViewChild('usernameVC') usernameVC: ElementRef;
  @ViewChild('passwordVC') passwordVC: ElementRef;
  @ViewChild('resetPasswordModal') resetPasswordModal;

  private _keyboardRef: MatKeyboardRef<MatKeyboardComponent>;
  private defaultLocale: string = 'US International';

  constructor(private modalService: NgbModal,
              private formBuilder: FormBuilder,
              private store: Store<AppState>,
              private sharedService: SharedService,
              private _keyboardService: MatKeyboardService) {}

  ngOnInit() {
    setTimeout(() => {
      this.store.dispatch(new FinalLoading({ loadingState: false }));
    });

    this.sharedService.hideFooter.emit(true);

    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false],
    });

    this.recoverPasswordForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      recovery_email: ['', [Validators.required, Validators.email]],
    });

    this.resetPasswordForm = this.formBuilder.group({
      code: ['', [Validators.required]],
      password: ['', [Validators.required]],
      confirmPwd: ['', [Validators.required]],
      username: ['', [Validators.required]],
    },
      {
        validator: PasswordValidation.MatchPassword
      });

    this.store.select(state => state.auth).takeUntil(this.destroyed$)
      .subscribe(authState => {
        this.isLoading = authState.inProgress;
        this.errorMessage = authState.errorMessage;
      });
  }

  ngOnDestroy() {
    this.sharedService.hideFooter.emit(false);
    this.closeKeyboard();
  }

  openResetPasswordModal() {
    this.isRecoverFormSubmitted = false;
    this.showResetPasswordFormErrors = false;
    this.recoverPasswordForm.reset();
    this.resetModalRef = this.modalService.open(this.resetPasswordModal, {
      centered: true,
      windowClass: 'modal-md'
    });
  }

  // == Toggle password visibility
  togglePassword(input: any): any {
    if (!input.value) {
      return;
    }
    input.type = input.type === 'password' ? 'text' : 'password';
  }

  login(user) {
    this.showFormErrors = true;
    if (this.loginForm.valid) {
      this.store.dispatch(new LogIn(user));
    }
  }

  recoverPassword(data) {
    this.showResetPasswordFormErrors = true;
    if (this.recoverPasswordForm.valid) {
      this.store.dispatch(new RecoverPassword(data));
      this.isRecoverFormSubmitted = true;
      this.showResetPasswordFormErrors = false;
    }
  }

  resetPassword(data) {
    this.showResetPasswordFormErrors = true;
  }

  openUsernameOSK() {
    if (this.isKeyboardOpened) {
      this.isKeyboardOpened = false;
      this.closeKeyboard();
      return;
    }
    if (!this._keyboardService.isOpened) {
      this._keyboardRef = this._keyboardService.open(this.defaultLocale, {});
    }
    this._keyboardRef.instance.setInputInstance(this.usernameVC);
    this._keyboardRef.instance.attachControl(this.loginForm.controls['username']);
    this.usernameVC.nativeElement.focus();
    this.isKeyboardOpened = true;
    this.prependCloseButtonToMatKeyboard();
  }

  openPasswordOSK() {
    if (this.isKeyboardOpened) {
      this.isKeyboardOpened = false;
      this.closeKeyboard();
      return;
    }
    if (!this._keyboardService.isOpened) {
      this._keyboardRef = this._keyboardService.open(this.defaultLocale, {});
    }
    this._keyboardRef.instance.setInputInstance(this.passwordVC);
    this._keyboardRef.instance.attachControl(this.loginForm.controls['password']);
    this.passwordVC.nativeElement.focus();
    this.isKeyboardOpened = true;
    this.prependCloseButtonToMatKeyboard();
  }

  closeKeyboard() {
    if (this._keyboardRef) {
      this._keyboardRef.dismiss();
    }
  }

  onInputFocusChange(input) {
    if (this.isKeyboardOpened) {
      this.isKeyboardOpened = false;
      if (input === 'username') {
        this.openUsernameOSK();
      } else if (input === 'password') {
        this.openPasswordOSK();
      }
    }
  }

  private prependCloseButtonToMatKeyboard() {
    const matKeyboardWrapper = document.getElementsByClassName('mat-keyboard-wrapper');
    if (matKeyboardWrapper && this.checkIfCloseButtonExist()) {
      const elChild = document.createElement('a');
      elChild.setAttribute('id', 'close-mat-keyboard');
      elChild.setAttribute('class', 'close-mat-keyboard');
      elChild.innerHTML = '<i class="fa fa-times" id="close-mat-keyboard-icon"></i>';
      // Prepend it to the parent element
      matKeyboardWrapper[0].insertBefore(elChild, matKeyboardWrapper[0].firstChild);
    }
  }

  private checkIfCloseButtonExist() {
    return !document.getElementById('close-mat-keyboard');
  }

  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (event.keyCode === ESCAPE_KEYCODE) {
      this.isKeyboardOpened = false;
      this.closeKeyboard();
    }
  }

  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (event.target.id === 'close-mat-keyboard' || event.target.id === 'close-mat-keyboard-icon') {
      this.isKeyboardOpened = false;
      this.closeKeyboard();
    }
  }

}
