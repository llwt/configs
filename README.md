# Home & Config Notes

## OSX 10.8.4

### HomeBrew

#### $PATH

Move `/usr/local/bin` from the bottom to the top of `/etc/paths` so that homebrew apps take priority.

### Powerline

_Make sure python is installed and you have reloaded your terminal. `$ which pip` should show `/usr/local/bin/php`._
_Make sure vim is installed with the as described below_

Install using pip.

    pip install git+git://github.com/Lokaltog/powerline
    mkdir ~/.config/powerline
    cp -R /usr/local/lib/python2.7/site-packages/powerline/config_files/* ~/.config/powerline
    
_note the "--user" flag should not be used when python is installed with brew._

[source(docs)](https://powerline.readthedocs.org/en/latest/installation/osx.html#installation-osx), [source(gh issue)](https://github.com/Lokaltog/powerline/issues/39)

### Python

#### Install

Install using brew, see note about `/usr/local/bin` in the HomeBrew -> $PATH section above.

    $ brew install python
    $ pip install --upgrade pip
    $ pip install --upgrade setuptools

[source](https://github.com/mxcl/homebrew/wiki/Homebrew-and-Python)

### Ruby

#### Install RVM with stable Ruby

    $ \curl -L https://get.rvm.io | bash -s stable --ruby
   
*There is a backslash before curl. This prevents misbehaving if you have aliased it with configuration in your ~/.curlrc file.*

#### For a progress bar when downloading RVM / Rubies:__

    $ echo progress-bar >> ~/.curlrc

[source](https://rvm.io/rvm/install)

### [Mac]Vim

Install using brew

    $ brew install vim --override-system-vim;
    
_Useful commands_

    :w !sudo tee %               "Save a file you edited without needed permissions
    :w !sudo tee > /dev/null %   "Same as above but hide stdout


