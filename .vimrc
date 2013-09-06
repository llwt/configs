if filereadable(expand("~/.vimrc.before"))
    source ~/.vimrc.before
endif
" Thanks to the people over at stack overflow for doing all the hard work and
" letting me pick out what I liked
" @url http://stackoverflow.com/questions/164847/what-is-in-your-vimrc

"----- Reminders -----"

" :BundleList          - list configured bundles
" :BundleInstall(!)    - install(update) bundles
" :BundleSearch(!) foo - search(or refresh cache first) for foo
" :BundleClean(!)      - confirm(or auto-approve) removal of unused bundles

"------ General Settings -----"

set nocompatible                " break away from old vi compatibility
set fileformats=unix,dos,mac    " support all three newline formats
set viminfo=                    " don't use or save viminfo files

"------ Console UI & Text display ------"

set ls=2                        " Always show status line
set showcmd                     " Show (partial) command in status line.
set number                      " yay line numbers
set ruler                       " show current position at bottom
set scrolloff=10                " keep at least 5 lines around the cursor
set list                        " show invisible characters
set listchars=tab:>·,trail:·    " but only show tabs and trailing whitespace
set wildmenu                    " turn on wild menu :e <Tab>
set wildmode=list:longest       " set wildmenu to list choice
if has('syntax')
    syntax on
    " Remember that rxvt-unicode has 88 colors by default; enable
    " this only if you are using the 256-color patch
    if &term == 'rxvt-unicode'
        set t_Co=256
    endif
endif

"------ Text editing and searching behavior ------"

set autoread                    " watch for file changes
set mouse=a                     " Yay! I can scroll with my mouse
set nohlsearch                  " turn off highlighting for searched expressions
set incsearch                   " highlight as we search however
set ignorecase                  " set case insensitivity
set smartcase                   " unless there's a capital letter
set nostartofline               " leave my cursor position alone!
set backspace=2                 " equiv to :set backspace=indent,eol,start
set textwidth=100               " 80 columns is not old news, I like 100
set showmatch                   " show matching brackets
set formatoptions=tcrql         " t - autowrap to textwidth
                                " c - autowrap comments to textwidth
                                " r - autoinsert comment leader with <Enter>
                                " q - allow formatting of comments with :gq
                                " l - don't format already long lines
set backup                      " backup files as we go
set backupdir=~/.vim/backup     " single location for backups
set directory=~/.vim/tmp        " temps in one location as well

"------ Indents and tabs ------"

set autoindent                  " set the cursor at same indent as line above
set cindent                     " be smart about indenting
set expandtab                   " expand <Tab>s with spaces; death to tabs!
set shiftwidth=4                " spaces for each step of (auto)indent
set softtabstop=4               " set virtual tab stop (compat for 8-wide tabs)
set tabstop=8                   " for proper display of files with tabs
set shiftround                  " always round indents to multiple of shiftwidth
set copyindent                  " use existing indents for new indents
set preserveindent              " save as much indent structure as possible
filetype plugin indent on       " load filetype plugins and indent settings

"----- Key [Re]Mapping -----"

" NOTE: Dont put comments afer mappings

set ttimeoutlen=100             " lower escape sequence timeout so escape key doesn't hang

" switch ; and : so we don't need <shift> for commands
nnoremap ; :
" still need ; sometimes
nnoremap ' ;

" eazy rocket ships
imap <C-l> <Space>=><Space>

" this is totally awesome - remap jj to escape in insert mode.
" you'll never type jj anyway, so it's great!
inoremap jj <Esc>

" create Blank Newlines and stay in Normal mode
nnoremap <silent> zj o<Esc>
nnoremap <silent> zk O<Esc>

" space will toggle folds!
nnoremap <space> za

" search mappings: These will make it so that going to the next one in a
" search will center on the line it's found in.
map N Nzz
map n nzz

"----- Auto Commands -----"

" remove any trailing whitespace that is in the file
autocmd BufRead,BufWrite * if ! &bin | silent! %s/\s\+$//ge | endif

"----- Vundle -----"

"-- Requred for Vundle! --"
filetype off
set rtp+=~/.vim/bundle/vundle/
call vundle#rc()

"-- Bundles --"
" NOTE: comments after Bundle command are not allowed..

" let Vundle manage Vundle required!
Bundle 'gmarik/vundle'

" rails stuff??
Bundle 'tpope/vim-rails.git'

" NERD Tree - navigate file structure
Bundle 'scrooloose/nerdtree'

" PHP
Bundle 'shawncplus/phpcomplete.vim'

" Syntax Hilighting
Bundle 'scrooloose/syntastic'

" since we disabled it earlier
filetype plugin indent on
